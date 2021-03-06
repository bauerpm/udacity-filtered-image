import AWS = require('aws-sdk');
import { Config, config } from './util/config';


//global variables
const c: Config = config;
const signedUrlExpireSeconds: number = 60 * 5

//Configure AWS
if (c.dev.aws_profile !== 'DEPLOYED') {
  var credentials: AWS.SharedIniFileCredentials = new AWS.SharedIniFileCredentials({profile: c.dev.aws_profile});
  AWS.config.credentials = credentials;
}

/**Initialize S3 service in app
 *  @Params
 *    Object:
 *        signatureVersion-string: The signature version to sign requests with 
 *            possible values: 'v2'|'v3'|'v4'
 *        region-string: aws-region
 *        params: {Bucket -string: S3 bucket name}
*/
export const s3: AWS.S3 = new AWS.S3({
  signatureVersion: 'v4',
  region: c.dev.aws_region,
  params: {Bucket: c.dev.aws_media_bucket}
});


/* getGetSignedUrl generates an aws signed url to retreive an item
 * @Params
 *    key: string - the filename to be put into the s3 bucket
 * @Returns:
 *    a url as a string
 */
export function getGetSignedUrl( key: string ): string{
    const url: string = s3.getSignedUrl('getObject', {
        Bucket: c.dev.aws_media_bucket,
        Key: key,
        Expires: signedUrlExpireSeconds,
      });
    return url;
}

/* getPutSignedUrl generates an aws signed url to put an item
 * @Params
 *    key: string - the filename to be retreived from s3 bucket
 * @Returns:
 *    a url as a string
 */
export function getPutSignedUrl( key: string ){
    const url: string = s3.getSignedUrl('putObject', {
      Bucket: c.dev.aws_media_bucket,
      Key: key,
      Expires: signedUrlExpireSeconds,
      ContentType: 'image/jpeg'
    });
    return url;
}
