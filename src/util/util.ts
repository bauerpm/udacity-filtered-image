import { PutObjectRequest } from 'aws-sdk/clients/s3';
import axios, { AxiosRequestConfig } from 'axios';
import fs from 'fs';
import Jimp = require('jimp');
import * as aws from '../aws'
const path = require('path');

// filterImageFromURL
// helper function to download, filter, and save the filtered image locally
// returns the absolute path to the local image
// INPUTS
//    inputURL: string - a publicly accessible url to an image file
// RETURNS
//    an absolute path to a filtered image locally saved file
export async function filterImageFromURL(inputURL: string, filter?: string): Promise<string>{
    return new Promise( async (resolve, reject) => {
        try {
            const photo: Jimp = await Jimp.read(inputURL);
            const outpath: string = '/tmp/filtered.'+Math.floor(Math.random() * 2000)+'.jpg';
            photo
            .resize(256, 256) // resize
            .quality(60) // set JPEG quality
            
            //handle optional filters
            if(filter) {
                filter === 'sepia' && photo.sepia();
                filter === 'greyscale' && photo.greyscale();
            }
            photo.write(__dirname+outpath, (img)=>{
                resolve(__dirname+outpath);
            }); 
        } catch (error) {
            reject(error)
        }
    });
}

// deleteLocalFiles
// helper function to delete files on the local disk
// useful to cleanup after tasks
// INPUTS
//    files: Array<string> an array of absolute paths to files
export async function deleteLocalFiles(files:Array<string>){
    for( let file of files) {
        fs.unlinkSync(file);
    }
}

//helper function to test url for validity
//INPUT
//  myURL - string URL to be tested
//Returns
// boolean
export function validURL(myURL: string) {
    var pattern: RegExp = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ //port
    '(\\?[;&amp;a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i');
    return pattern.test(myURL);
 }

 //uploadToS3
 //Helper function to upload local file to S3 bukcet,
 // INPUTS
 //     fileName -string  name of local file
 //     path -string path to local file

 export async function uploadToS3PresignedUrl (fileName: string) {
    return new Promise(async (resolve, reject) => {
       try {
           const preSignedPutUrl: string = aws.getPutSignedUrl(fileName);
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


  //helper function to upload image to S3 in the deployed environment.
  // INPUTS
  //     fileName -string  name of local file
  export async function uploadToS3(fileName: string) {
    return new Promise(async (resolve, reject) => {
       try {
           const _path: string = path.resolve(__dirname, 'tmp', fileName)
           const file: Buffer = await fs.promises.readFile(_path)
           const config: PutObjectRequest = {
               Bucket: process.env.AWS_MEDIA_BUCKET,
               Key: fileName,
               Body: file
           }
           aws.s3.putObject(config, (err, data) => {
               if(err) {
                   reject({message: 'S3 upload failed', error: err})
               }
               return resolve({message: `Successfully uploaded ${fileName} to S3 Bucket`, response: data})
           });
       } catch (error) {
           reject(error)
       }
    })  
  }
