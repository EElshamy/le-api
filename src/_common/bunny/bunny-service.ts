import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Collection } from '@src/course/models/collection.model';
import { User } from '@src/user/models/user.model';
import axios from 'axios';
import { addMinutes } from 'date-fns';
import { createHash } from 'node:crypto';
import { Repositories } from '../database/database-repository.enum';
import { IRepository } from '../database/repository.interface';
import { BaseHttpException } from '../exceptions/base-http-exception';
import { ErrorCodeEnum } from '../exceptions/error-code.enum';
import { File } from '../uploader/file.model';
import {
  BunnyVideoResponse,
  CreateVideoForUploadResponse,
  UploadedVideoLibrary
} from './bunny.type';
import { GetBunnyUploadCredentials } from './inputs/get-upload-credentials.input';
import {
  GetBunnyViewVideoSignature
} from './inputs/get-view-video-credentials.input';

@Injectable()
export class BunnyService {
  private apiKey = this.configService.get<string>('BUNNY_API_KEY');
  // course
  private courseLibraryApiKey = this.configService.get<string>(
    'BUNNY_COURSE_LIBRARY_API_KEY'
  );
  private courseLibraryId = this.configService.get<string>(
    'BUNNY_COURSE_LIBRARY_ID'
  );
  private courseAuthTokenKey = this.configService.get<string>(
    'BUNNY_COURSE_TOKEN_AUTH_KEY'
  );
  private courseCDNHostName = this.configService.get<string>(
    'BUNNY_COURSE_CDN_HOST_NAME'
  );

  //workshop
  private workshopLibraryApiKey =
    this.configService.get<string>('BUNNY_WORKSHOP_LIBRARY_API_KEY') ??
    this.configService.get<string>('BUNNY_WORKSHOP_LIBRARY_API_kEY'); // ! this is temp solution till the variable name be fixed
  private workshopLibraryId = this.configService.get<string>(
    'BUNNY_WORKSHOP_LIBRARY_ID'
  );
  private workshopAuthTokenKey = this.configService.get<string>(
    'BUNNY_WORKSHOP_TOKEN_AUTH_KEY'
  );
  private workshopCDNHostName = this.configService.get<string>(
    'BUNNY_WORKSHOP_CDN_HOST_NAME'
  );

  //diploma
  private diplomaLibraryApiKey = this.configService.get<string>(
    'BUNNY_DIPLOMA_LIBRARY_API_KEY'
  );
  private diplomaLibraryId = this.configService.get<string>(
    'BUNNY_DIPLOMA_LIBRARY_ID'
  );
  private diplomaAuthTokenKey = this.configService.get<string>(
    'BUNNY_DIPLOMA_TOKEN_AUTH_KEY'
  );
  private diplomaCDNHostName = this.configService.get<string>(
    'BUNNY_DIPLOMA_CDN_HOST_NAME'
  );
  constructor(
    private readonly configService: ConfigService,
    @Inject(Repositories.FilesRepository)
    private readonly fileRepo: IRepository<File>,
    @Inject(Repositories.CollectionsRepository)
    private readonly collectionRepo: IRepository<Collection>
  ) {}

  private getLibraryIdAndApiKey(type: UploadedVideoLibrary) {
    switch (type) {
      case UploadedVideoLibrary.COURSE:
        return {
          apiKey: this.courseLibraryApiKey,
          libraryId: this.courseLibraryId
        };

      case UploadedVideoLibrary.WORKSHOP:
        return {
          apiKey: this.workshopLibraryApiKey,
          libraryId: this.workshopLibraryId
        };

      case UploadedVideoLibrary.DIPLOMA:
        return {
          apiKey: this.diplomaLibraryApiKey,
          libraryId: this.diplomaLibraryId
        };

      default:
        break;
    }
  }

  private getAuthTokenKeyAndLibraryIdAndCdn(type: UploadedVideoLibrary) {
    switch (type) {
      case UploadedVideoLibrary.COURSE:
        return {
          authToken: this.courseAuthTokenKey,
          libraryId: this.courseLibraryId,
          CDN_HOST_NAME: this.courseCDNHostName
        };

      case UploadedVideoLibrary.WORKSHOP:
        return {
          authToken: this.workshopAuthTokenKey,
          libraryId: this.workshopLibraryId,
          CDN_HOST_NAME: this.workshopCDNHostName
        };

      case UploadedVideoLibrary.DIPLOMA:
        return {
          authToken: this.diplomaAuthTokenKey,
          libraryId: this.diplomaLibraryId,
          CDN_HOST_NAME: this.diplomaCDNHostName
        };

      default:
        throw new Error('Invalid video type');
    }
  }

  /**
   * STEPS
   * 1- create video and return its data to front end to use tus api
   * https://docs.bunny.net/reference/tus-resumable-uploads
   */

  async createVideo(
    input: GetBunnyUploadCredentials,
    currentUserId: string
  ): Promise<CreateVideoForUploadResponse> {
    try {
      const apiKeyAndLibraryId = this.getLibraryIdAndApiKey(input.type);

      const response = await axios.post(
        `https://video.bunnycdn.com/library/${apiKeyAndLibraryId.libraryId}/videos`,
        {
          title: input.videoTitle,
          ...(input.collectionId && { collectionId: input.collectionId })
        },
        {
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            AccessKey: apiKeyAndLibraryId.apiKey
          }
        }
      );
      const expirationTime = this.getExpirationTimeInSeconds(15);
      const videoId = response.data.guid;
      const dataToHash =
        apiKeyAndLibraryId.libraryId +
        apiKeyAndLibraryId.apiKey +
        expirationTime +
        videoId;
      await this.fileRepo.createOne({
        name: input.videoTitle,
        mimetype: input.contentType,
        uploadedById: currentUserId,
        sizeInBytes: input.sizeInBytes,
        relativeDiskDestination: `${input.type}/${videoId}`,
        videoId
      });
      return {
        videoId,
        expirationTime,
        authorizationSignature: this.generateSha256Signature(dataToHash),
        libraryId: apiKeyAndLibraryId.libraryId
      };
    } catch (err) {
      console.log(err);
      throw new BaseHttpException(ErrorCodeEnum.CREATING_VIDEO_ERROR);
    }
  }

  async getViewVideoCredentials(
    input: GetBunnyViewVideoSignature
  ): Promise<BunnyVideoResponse> {
    const expirationTime = this.getExpirationTimeInSeconds(15);
    const authTokenAndLibraryIdAndCDN = this.getAuthTokenKeyAndLibraryIdAndCdn(
      input.type
    );

    const dataToHash =
      authTokenAndLibraryIdAndCDN.authToken + input.videoId + expirationTime;

    const authorizationSignature = this.generateSha256Signature(dataToHash);

    const baseUrl = `https://iframe.mediadelivery.net/embed/${authTokenAndLibraryIdAndCDN.libraryId}/${input.videoId}`;
    const finalUrl = `${baseUrl}?token=${authorizationSignature}&expires=${expirationTime}`;

    // Fetch video data
    const videoData = await this.getVideoData(
      input.videoId,
      authTokenAndLibraryIdAndCDN,
      authorizationSignature,
      expirationTime
    );

    const maxResolution = await this.findHighestAvailableResolution(
      input.videoId,
      authTokenAndLibraryIdAndCDN.CDN_HOST_NAME,
      videoData?.availableResolutions || []
    );

    const isReady = videoData?.isReady || false;

    const baseUrlForMobile = `https://${authTokenAndLibraryIdAndCDN.CDN_HOST_NAME}/${input.videoId}/play_${maxResolution}.mp4`;
    const finalUrlForMobile = `${baseUrlForMobile}?token=${authorizationSignature}&expires=${expirationTime}`;

    return {
      finalUrl,
      finalUrlForMobile,
      isReady,
      title: videoData?.title || null,
      thumbnailUrl: videoData?.thumbnailUrl || null,
      availableResolutions: videoData?.availableResolutions || null,
      length: videoData?.length || null,
      views: videoData?.views || null
    };
  }

  private async getVideoData(
    videoId: string,
    authTokenAndLibraryId: {
      authToken: string;
      libraryId: string;
    },
    token: string,
    expirationTime: number
  ): Promise<Omit<BunnyVideoResponse, 'finalUrl' | 'finalUrlForMobile'>> {
    const apiUrl = `https://video.bunnycdn.com/library/${authTokenAndLibraryId.libraryId}/videos/${videoId}/play?token=${token}&expires=${expirationTime}`;
    try {
      const response = await axios.get(apiUrl, {
        headers: {
          accept: 'application/json',
          AccessKey: this.courseAuthTokenKey
        }
      });

      // console.log('response :' , response);
      // console.log('-----------------')
      // console.log('response data:', response.data);
      // console.log('-----------------')

      const videoData = response.data.video; // Extract the video data from the response
      const isReady =
        videoData.status === 4 &&
        videoData.encodeProgress === 100 &&
        videoData.availableResolutions !== '';

      return {
        isReady,
        title: videoData.title,
        thumbnailUrl: response.data.thumbnailUrl,
        availableResolutions: videoData.availableResolutions.split(','),
        length: videoData.length,
        views: videoData.views
      };
    } catch (error) {
      console.error('Error fetching video data:', error.message);
      return { isReady: false };
    }
  }

  private async findHighestAvailableResolution(
    videoId: string,
    cdnHostName: string,
    availableResolutions: string[]
  ): Promise<string> {
    const sortedResolutions = availableResolutions
      .map(res => parseInt(res))
      .sort((a, b) => b - a);

    for (const resolution of sortedResolutions) {
      const testUrl = `https://${cdnHostName}/${videoId}/play_${resolution}p.mp4`;

      try {
        const response = await axios.head(testUrl);

        if (response.status === 200) {
          return `${resolution}p`;
        }
      } catch (error) {
        console.warn(`Resolution ${resolution}p is not available.`);
      }
    }

    return '720p';
  }

  async deleteVideos(videoIds: string[], type: UploadedVideoLibrary) {
    try {
      const apiKeyAndLibraryId = this.getLibraryIdAndApiKey(type);
      const requests = videoIds.map(videoId =>
        axios.delete(
          `https://video.bunnycdn.com/library/${apiKeyAndLibraryId.libraryId}/videos/${videoId}`,
          {
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
              AccessKey: apiKeyAndLibraryId.apiKey
            }
          }
        )
      );
      let responses = [];
      try {
        responses = await axios.all(requests);
      } catch (error) {
        console.log(error);
      }
      responses.forEach((response, index) => {
        console.log(`Response from endpoint ${index + 1}:`, response.data);
      });
    } catch (error) {
      console.error(error);
    }
  }

  async createCourseCollection(
    type: UploadedVideoLibrary,
    currentUser: User,
    collectionName?: string
  ) {
    const apiKeyAndLibraryId = this.getLibraryIdAndApiKey(type);
    // Incase the name is empty it would use the current user code as a draft collection
    const name =
      collectionName ? collectionName : (
        `${currentUser.code}-${new Date().toISOString().split('T')[0]} Collection`
      );
    try {
      const { data } = await axios.post(
        `https://video.bunnycdn.com/library/${apiKeyAndLibraryId.libraryId}/collections`,
        {
          name
        },
        {
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            AccessKey: apiKeyAndLibraryId.apiKey
          }
        }
      );

      // Create a blueprint of the collection to remove it in the crone job if it was not used
      if (data?.guid) {
        await this.collectionRepo.createOne({
          name,
          userId: currentUser.id,
          type,
          ...(type === UploadedVideoLibrary.DIPLOMA && { hasReference: true }),
          id: data?.guid
        });
        return data?.guid;
      } else {
        throw new BaseHttpException(ErrorCodeEnum.CREATING_COLLECTION_ERROR);
      }
    } catch (error) {
      console.error(error);
      throw new BaseHttpException(ErrorCodeEnum.CREATING_COLLECTION_ERROR);
    }
  }

  async updateCollectionName(
    collectionId: string,
    name: string,
    type: UploadedVideoLibrary
  ) {
    const apiKeyAndLibraryId = this.getLibraryIdAndApiKey(type);
    try {
      await axios.post(
        `https://video.bunnycdn.com/library/${apiKeyAndLibraryId.libraryId}/collections/${collectionId}`,
        {
          name
        },
        {
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            AccessKey: apiKeyAndLibraryId.apiKey
          }
        }
      );
    } catch (error) {
      console.error(error);
    }
  }

  async deleteCollection(collectionId: string, type: UploadedVideoLibrary) {
    const apiKeyAndLibraryId = this.getLibraryIdAndApiKey(type);
    type === UploadedVideoLibrary.COURSE &&
      (await this.collectionRepo.deleteAll({ id: collectionId }));
    return axios.delete(
      `https://video.bunnycdn.com/library/${apiKeyAndLibraryId.libraryId}/collections/${collectionId}`,
      {
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          AccessKey: apiKeyAndLibraryId.apiKey
        }
      }
    );
  }

  private generateSha256Signature(data: string) {
    return createHash('sha256').update(data).digest('hex');
  }

  private getExpirationTimeInSeconds(minutesToAdd: number) {
    return Math.ceil(addMinutes(new Date(), minutesToAdd).getTime() / 1000);
  }
  deleteFile(filePath: string) {
    const fileType = filePath.split('/')[0];
    const fileId = filePath.split('/')[1];
    return this.deleteVideos(
      [fileId],
      fileType as unknown as UploadedVideoLibrary
    );
  }

  async reEncodeAllBunnyVideos(type: UploadedVideoLibrary): Promise<boolean> {
    const apiKeyAndLibraryId = this.getLibraryIdAndApiKey(type);

    let allSuccess = true;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const listUrl = `https://video.bunnycdn.com/library/${apiKeyAndLibraryId.libraryId}/videos?page=${page}&itemsPerPage=100`;

        const res = await axios.get(listUrl, {
          headers: {
            accept: 'application/json',
            AccessKey: apiKeyAndLibraryId.apiKey
          }
        });

        const videos = res.data?.items ?? [];

        console.log(`✅ Fetched ${videos.length} videos from page ${page}`);

        if (!videos.length) {
          hasMore = false;
          break;
        }

        for (const video of videos) {
          try {
            const reencodeUrl = `https://video.bunnycdn.com/library/${apiKeyAndLibraryId.libraryId}/videos/${video.guid}/reencode`;

            const reencodeRes = await axios.post(
              reencodeUrl,
              {},
              {
                headers: {
                  accept: 'application/json',
                  AccessKey: apiKeyAndLibraryId.apiKey
                }
              }
            );

            console.log(
              `✅ Re-encode started for videoId=${video.guid}, status=${reencodeRes.status}, message=${reencodeRes.statusText}`
            );
          } catch (error) {
            allSuccess = false;
            console.error(
              `❌ Failed to re-encode videoId=${video.guid}, error=${error.message}`
            );
          }
        }

        hasMore = videos.length === 100;
        page++;
      } catch (error) {
        console.error(`❌ Failed to fetch videos, error=${error.message}`);
        allSuccess = false;
        break;
      }
    }

    console.log(
      `🎉 Finished re-encoding all videos for libraryId=${apiKeyAndLibraryId.libraryId}`
    );

    return allSuccess;
  }
}
