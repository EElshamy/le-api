import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import type { Express } from 'express';

export interface IStorageStrategy {
  uploadFile(file: Express.Multer.File, path?: string): Promise<string>;
  deleteFile(key: string): Promise<void>;
  getFileUrl(key: string): string;
  listFiles(prefix?: string): Promise<string[]>;
}
