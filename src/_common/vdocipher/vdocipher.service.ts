import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PlaybackInfo, VdocipherUploadCredentials } from './vdocipher.type';
import { BaseHttpException } from '../exceptions/base-http-exception';
import { ErrorCodeEnum } from '../exceptions/error-code.enum';
import { GetVdocipherUploadCredentials } from './inputs/get-upload-credentials.input';

@Injectable()
export class VdocipherService {
  private readonly vdocipherApiKey =
    this.configService.get<string>('VDOCIPHER_API_KEY') ||
    'EgfNc1xXsGoWagz9edrSwor7dVbZamBegkvOjzmoJp8JVj0DejQRcMOV4NyLABMd';
  constructor(private readonly configService: ConfigService) {}

  async getUploadCredentials(
    input: GetVdocipherUploadCredentials
  ): Promise<VdocipherUploadCredentials> {
    try {
      const folderId = await this.getFolderIdByName(input.folder);
      const response = await axios({
        method: 'PUT',
        url: 'https://dev.vdocipher.com/api/videos',
        headers: { Authorization: `Apisecret ${this.vdocipherApiKey}` },
        params: {
          title: input.videoTitle,
          folderId
        }
      });
      const res = response.data;

      return {
        ...res.clientPayload,
        videoId: res.videoId,
        xAmzAlgorithm: res.clientPayload['x-amz-algorithm'],
        xAmzCredentials: res.clientPayload['x-amz-credential'],
        xAmzDate: res.clientPayload['x-amz-date'],
        xAmzSignature: res.clientPayload['x-amz-signature']
      };
    } catch (err) {
      console.log(err);
      throw new BaseHttpException(ErrorCodeEnum.FAILED_TO_FETCH_CREDENTIALS);
    }
  }

  async getVdocipherPlaybackInfo(videoId: string): Promise<PlaybackInfo> {
    try {
      const response = await axios({
        method: 'POST',
        url: `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Apisecret ${this.vdocipherApiKey}`
        },
        data: { ttl: 300 }
      });
      return response.data;
    } catch (err) {
      console.log(err);
      throw new BaseHttpException(ErrorCodeEnum.FAILD_TO_FETCH_PLAYBACK_INFO);
    }
  }

  private async getFolderIdByName(folderName: string): Promise<string> {
    try {
      const doesFolderExist = await axios({
        method: 'POST',
        url: 'https://dev.vdocipher.com/api/videos/folders/search',
        headers: {
          Authorization: `Apisecret ${this.vdocipherApiKey}`
        },
        data: {
          name: folderName,
          searchExact: true
        }
      });

      const folderId = doesFolderExist.data.folders[0]?.id;
      if (folderId) return folderId;

      const folderCreationResponse = await axios({
        method: 'POST',
        url: 'https://dev.vdocipher.com/api/videos/folders',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Apisecret ${this.vdocipherApiKey}`
        },
        data: {
          name: folderName,
          parent: 'root'
        }
      });

      return folderCreationResponse.data.id;
    } catch (error) {
      console.error(error);
      throw new BaseHttpException(ErrorCodeEnum.VDOCIPHER_FOLDER_ERROR);
    }
  }

  public async deleteVideos(videoIDs: string[]): Promise<void> {
    try {
      const response = await axios({
        method: 'DELETE',
        url: 'https://dev.vdocipher.com/api/videos',
        params: { videos: videoIDs.join(',') },
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Apisecret ${this.vdocipherApiKey}`
        }
      });
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  }
}
