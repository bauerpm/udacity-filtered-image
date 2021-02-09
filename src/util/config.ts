export interface Config {
  dev: {
    aws_region: string;
    aws_profile: string;
    aws_media_bucket: string;
  }
}

export const config: Config = {
  "dev": {
    "aws_region": process.env.AWS_REGION,
    "aws_profile": process.env.AWS_PROFILE,
    "aws_media_bucket": process.env.AWS_MEDIA_BUCKET,
  },
}