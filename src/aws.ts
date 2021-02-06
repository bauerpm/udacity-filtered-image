import fs from 'fs';
import AWS = require('aws-sdk');
import axios, { AxiosRequestConfig } from 'axios';
import { config } from './util/config';
const path = require('path');

//global variables
const c = config.dev;
const signedUrlExpireSeconds = 60 * 5

//Configure AWS
if (c.aws_profile !== 'DEPLOYED') {
  var credentials = new AWS.SharedIniFileCredentials({profile: c.aws_profile});
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
  region: c.aws_region,
  params: {Bucket: c.aws_media_bucket}
});


/* getGetSignedUrl generates an aws signed url to retreive an item
 * @Params
 *    key: string - the filename to be put into the s3 bucket
 * @Returns:
 *    a url as a string
 */
export function getGetSignedUrl( key: string ): string{
    const url: string = s3.getSignedUrl('getObject', {
        Bucket: c.aws_media_bucket,
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
    const url = s3.getSignedUrl('putObject', {
      Bucket: c.aws_media_bucket,
      Key: key,
      Expires: signedUrlExpireSeconds,
      ContentType: 'image/jpeg'
    });
    return url;
}

//uploadToS3
 //Helper function to upload local file to S3 bukcet,
 // INPUTS
 //     fileName -string  name of local file
 //     path -string path to local file

 export async function uploadToS3 (fileName: string) {
  return new Promise(async (resolve, reject) => {
     try {
         const preSignedPutUrl: string = getPutSignedUrl(fileName);
         const _path: string = path.resolve(__dirname, 'tmp', fileName)
         const file: Buffer = await fs.promises.readFile(_path)
         const config: AxiosRequestConfig = {
             method: 'put',
             url: preSignedPutUrl,
             headers: {
                 'Content-Type': 'image/jpeg'
             },
             data: file,
         }
         await axios(config)
         resolve(`Successfully uploaded ${fileName} to S3 Bucket`)
     } catch (error) {
         reject(error)
     }
  })  
}