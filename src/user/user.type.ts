import { ObjectType, Field, Float } from '@nestjs/graphql';

export class FcmTokensType {
  android?: string[];
  ios?: string[];
  desktop?: string[];
}

@ObjectType()
export class LocationType {
  @Field()
  type: string;

  // https://postgis.net/2013/08/18/tip_lon_lat/
  // long,lat
  @Field(() => [Float])
  coordinates: number[];
}

@ObjectType()
export class CountryType {
  @Field()
  isoCode: string;

  @Field()
  name: string;
}
