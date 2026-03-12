import * as path from 'path';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as slug from 'speakingurl';
import * as dateFns from 'date-fns';
import { generate } from 'voucher-code-generator';
import { Injectable } from '@nestjs/common';
import { Upload } from '../uploader/uploader.type';
import { ImageExtensionsAsSet } from './image.extensions';
import { VideoExtensionsAsSet } from './video.extensions';
import { Timezone } from '../graphql/graphql-response.type';
import { IRepository } from '../database/repository.interface';
import { BaseHttpException } from '../exceptions/base-http-exception';
import { ErrorCodeEnum } from '../exceptions/error-code.enum';
import { WhereOptions } from 'sequelize';
import { CodePrefix } from './helpers.enum';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { BadRequestException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Repository } from 'sequelize-typescript';
import { Repositories } from '../database/database-repository.enum';
import { parse } from 'json2csv';
import { S3Service } from '@src/_common/aws/s3/s3.service';
import { format } from 'date-fns';
import { DigitalOceanSpacesService } from '../digitalocean/services/spaces.service';

@Injectable()
export class HelperService {
  constructor(
    private readonly config: ConfigService,
    private moduleRef?: ModuleRef,
    // private readonly s3Service?: S3Service
    private readonly digitalOceanService?: DigitalOceanSpacesService
  ) {}

  public slugify(value: string): string {
    if (value.charAt(value.length - 1) === '-')
      value = value.slice(0, value.length - 1);
    return `${slug(value, { titleCase: true })}-${
      generate({
        charset: '123456789abcdefghgklmnorstuvwxyz',
        length: 4
      })[0]
    }`.toLowerCase();
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  public updateProvidedFields<T>(model: T, input: object): T {
    Object.keys(input).map(field => (model[field] = input[field]));
    return model;
  }

  public async getFileName(file: Upload | string) {
    if (typeof file === 'string') return file;

    const { filename } = await file;
    return filename;
  }

  getDayMinutesFromTimestamp(timestamp: number) {
    const startOfDay = new Date(timestamp).setUTCHours(0, 0, 0, 0);
    return dateFns.differenceInMinutes(new Date(timestamp), startOfDay);
  }

  setTimestampBasedOnDayMinutes(timestamp: number, requiredMinutes: number) {
    const startOfDay = new Date(timestamp).setUTCHours(0, 0, 0, 0);
    return dateFns.addMinutes(startOfDay, requiredMinutes).getTime();
  }

  upperCaseFirstLetter(str: string) {
    return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
  }

  public isImage(filePath: string): boolean {
    if (!filePath) return false;
    return ImageExtensionsAsSet.has(
      path.extname(filePath).slice(1).toLowerCase()
    );
  }

  public isVideo(filePath: string): boolean {
    if (!filePath) return false;
    return VideoExtensionsAsSet.has(
      path.extname(filePath).slice(1).toLowerCase()
    );
  }

  public encryptStringWithRsaPublicKey(
    toEncrypt: string,
    relativeOrAbsolutePathToPublicKey: string
  ) {
    const absolutePath = path.resolve(relativeOrAbsolutePathToPublicKey);
    const publicKey = fs.readFileSync(absolutePath, 'utf8');
    const buffer = Buffer.from(toEncrypt);
    const encrypted = crypto.publicEncrypt(publicKey, buffer);
    return encrypted.toString('base64');
  }

  public decryptStringWithRsaPrivateKey(
    toDecrypt: string,
    relativeOrAbsolutePathToPrivateKey: string
  ) {
    const absolutePath = path.resolve(relativeOrAbsolutePathToPrivateKey);
    const privateKey = fs.readFileSync(absolutePath, 'utf8');
    const buffer = Buffer.from(toDecrypt, 'base64');
    const decrypted = crypto.privateDecrypt(privateKey, buffer);
    return decrypted.toString('utf8');
  }

  public getTimeBasedOnTimezone(
    timezoneObj: Timezone,
    date?: Date | number
  ): Date {
    let timeBasedOnTimezone = new Date(date) || new Date();
    if (timezoneObj.minusSign) {
      timeBasedOnTimezone = dateFns.subHours(
        timeBasedOnTimezone,
        timezoneObj.hours
      );
      timeBasedOnTimezone = dateFns.subMinutes(
        timeBasedOnTimezone,
        timezoneObj.minutes
      );
    } else {
      timeBasedOnTimezone = dateFns.addHours(
        timeBasedOnTimezone,
        timezoneObj.hours
      );
      timeBasedOnTimezone = dateFns.addMinutes(
        timeBasedOnTimezone,
        timezoneObj.minutes
      );
    }
    return timeBasedOnTimezone;
  }

  public trimAllSpaces(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  deriveMapFromArray<T>(array: T[], mapFn: (item: T) => any) {
    const map = new Map<any, any>();
    array.forEach(item => {
      map.set(mapFn(item), item);
    });
    return map;
  }

  public generateRandomNumber(length: number) {
    const characters = '0123456789';
    return this.generateRandomString(length, characters);
  }

  public generateRandomString(length: number, characterSet: string) {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characterSet.charAt(
        Math.floor(Math.random() * characterSet.length)
      );
    }
    return result;
  }

  public generateRandomPassword() {
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';
    return this.generateRandomString(15, chars);
  }
  async generateModelCodeWithPrefix<T>(
    prefix: CodePrefix,
    repo: IRepository<T>
  ): Promise<string> {
    let counter = 0,
      doesCodeExist,
      code;
    do {
      counter += 1;
      if (counter >= 10)
        throw new BaseHttpException(ErrorCodeEnum.UNKNOWN_ERROR);
      code = `${prefix}-${this.generateRandomNumber(8)}`;
      doesCodeExist = await repo.findOne(<WhereOptions<T>>{ code });
    } while (doesCodeExist);
    return code;
  }

  generateAuthToken(input: {
    userId: string;
    sessionId?: string;
    isTemp?: boolean;
    expiresIn?: string;
    isAdmin?: boolean;
  }): string {
    return jwt.sign(
      {
        userId: input.userId,
        ...(input.sessionId && { sessionId: input.sessionId }),
        ...((input.isTemp || input.expiresIn) && { isTemp: true })
      },
      this.config.get('JWT_SECRET'),
      {
        expiresIn:
          input.isTemp ? 30 * 60
          : input.isAdmin ? '1d'
          : input.expiresIn ? input.expiresIn
          : '7d'
      }
    );
  }

  async getItemsByIdsAndMap(itemsIds: string[], repo: IRepository<any>) {
    const items = await repo.findAll({ id: itemsIds });
    return itemsIds.map(itemId => items.find(item => item.id === itemId));
  }

  validateObjectAtLeastOneKey(obj) {
    return Object.keys(obj).length > 0;
  }

  async validateDto<T extends Object>(
    dtoClass: new () => T,
    data: Partial<T>,
    options: { message?: ErrorCodeEnum } = {}
  ): Promise<T> {
    const dtoInstance = plainToInstance(dtoClass, data);
    const errors: ValidationError[] = await validate(dtoInstance);
    if (errors.length > 0) {
      const errorMessages = errors
        .map(err => Object.values(err.constraints || {}).join(', '))
        .join('; ');
      if (options.message) throw new BaseHttpException(options.message);
      else
        throw new BaseHttpException(ErrorCodeEnum.VALIDATION_FAILED, {
          errors: errorMessages
        });
    }
    return dtoInstance;
  }

  async createCSVFile(data: any, handled: boolean = false): Promise<string> {
    let CSVContent;
    if (!handled) {
      const finalData = await data.map(item => item.dataValues);
      CSVContent = await this.convertToCSV(finalData);
    } else {
      CSVContent = data;
    }

    const CSVBuffer = Buffer.from(CSVContent, 'utf-8');

    await this.digitalOceanService.uploadFile({
      filePath: `exports/export.csv`,
      fileBuffer: CSVBuffer,
      contentType: 'text/csv'
    });

    return await this.digitalOceanService.getPresignedUrlForDownload(
      `exports/export.csv`
    );
  }

  // format date time to yyyy-MM-dd HH:mm:ss
  formatDateTime(date: any): string {
    if (!date) return '';
    return format(new Date(date), 'yyyy-MM-dd HH:mm:ss');
  }

  private async convertToCSV(data: any[] | any) {
    try {
      const csvContent = await parse(data);
      return csvContent;
    } catch (err) {
      console.log('error when converting to csv : ', err);
    }
  }
}
