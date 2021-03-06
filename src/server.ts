import express, { Request, Response, Express } from 'express';
require('dotenv').config();
import bodyParser from 'body-parser';
import * as util from './util/util';
import * as aws from './aws'

(async () => {

  // Init the Express application
  const app: Express = express();

  // Set the network port
  const port: string | number = process.env.PORT || 8082;
  
  // Use the body parser middleware for post requests
  app.use(bodyParser.json());
  
  // Root Endpoint
  // Displays a simple message to the user
  app.get( "/", async ( req: Request, res: Response ) => {
    res.send("try GET /filteredimage?image_url={{}}")
  } );

  // route to get image from public url, filter it, save to disk, then erase from disk.
  // get /filteredimage?image_url={{URL}}
  app.get("/filteredimage", async (req: Request, res: Response) => {
    const image_url: string = req.query.image_url as string;

    if (!image_url) {
      return res.status(400).send('request must have contain a query string ?image_url={{URL}}')
    }
    const isValidUrl: boolean = util.validURL(image_url)
    if(!isValidUrl) {
      return res.status(400).send('Invalid Url')
    }
    try {
      const filteredPath: string = await util.filterImageFromURL(image_url, 'greyscale')
      util.deleteLocalFiles([filteredPath])
      res.status(200).send(filteredPath)
    } catch (error) {
      res.status(500).send({error, message: 'There was a problem filtering or saving your file. Make sure the image url provided is valid.'})
    }
  })

  //route to optionally filter image and then upload to S3 bucket
  //optional body param {filter: filter_type}
  //  filter_type - 'greyscale' | 'sepia'  no filter if not added
  app.post("/filteredimage/upload", async (req: Request, res: Response) => {
    const image_url: string = req.query.image_url as string;
    const filter: string = req.body.filter

    if (!image_url) {
      return res.status(400).send('request must have contain a query string ?image_url={{URL}}')
    }
    const isValidUrl: boolean = util.validURL(image_url)
    if(!isValidUrl) {
      return res.status(400).send('Invalid Url')
    }
    try {
      const filteredPath: string = await util.filterImageFromURL(image_url, filter)
      const fileName: string = filteredPath.slice(filteredPath.lastIndexOf('/') + 1)

      if(process.env.AWS_PROFILE === 'DEPLOYED') {
        const response = await util.uploadToS3(fileName)
        util.deleteLocalFiles([filteredPath])
        return res.status(200).send(response)
      }
      const response = await util.uploadToS3PresignedUrl(fileName)
      util.deleteLocalFiles([filteredPath])
      res.status(200).send(response)
    } catch (error) {
      res.status(500).send({message: 'There was a problem filtering or saving your file. Make sure the url provided is valid.', error})
    }
  })

  // route to get and return preSigned Get URl from S3.
  //returns the presignedURL which can be used to download image from S3
  app.get( "/filteredimage/:file_name", async (req: Request, res: Response) => {
    const { file_name } = req.params;
    try {
      if(!file_name) {
        return res.status(400).send('File name is required to download image')
      }

      const preSignedGetURL:string = aws.getGetSignedUrl(file_name)
      
      res.status(200).send({url: preSignedGetURL})
    } catch (error) {
      console.log(error)
      res.status(400).send(error)
    }
  })



  // Start the Server
  app.listen( port, () => {
      console.log( `server running http://localhost:${ port }` );
      console.log( `press CTRL+C to stop server` );
  } );
})();