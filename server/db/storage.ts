import FormData from 'form-data'
import { createReadStream } from 'fs'
import axios from 'axios'
import { PutObjectRequest } from 'aws-sdk/clients/s3'
import AWS from 'aws-sdk'
import { ServerResponse } from 'http'
import logger from '../logger'
import config from '../config'

const log = logger(config.prefix, config.version)
interface StorageProps {
  backing?: string
  endpoint?: string
  region?: string
}

class Storage {
  backing?: string
  s3?: AWS.S3
  constructor(props: StorageProps) {
    this.backing = props.backing
    if (this.backing === 'aws') {
      // const credentials = new AWS.SharedIniFileCredentials({
      //   profile: 'dymajo',
      // })
      // AWS.config.credentials = credentials
      this.s3 = new AWS.S3({
        endpoint: props.endpoint,
        region: props.region,
      })
    }
  }

  createContainer(container: string, cb: any) {
    const createCb = (error: any) => {
      if (error) {
        log.error(error)
        throw error
      }
      cb()
    }
    if (this.backing === 'aws' && this.s3) {
      const params = {
        Bucket: container,
      }
      this.s3.createBucket(params, createCb)
    }
  }

  async downloadStream(
    container: string,
    file: string,
    stream: ServerResponse,
    callback: (error: any, data?: any) => void,
  ) {
    if (this.backing === 'aws' && this.s3) {
      const params = {
        Bucket: container,
        Key: file,
      }
      return this.s3
        .getObject(params)
        .createReadStream()
        .on('error', err => {
          // if (err.code !== 'NoSuchKey') {
          log.error(err)
          // }
          callback(err)
        })
        .on('end', (data: any) => callback(null, data)) // do nothing, but this prevents from crashing
        .pipe(stream)
    }
    return null
  }

  async uploadFile(container: string, file: string, sourcePath: string) {
    if (this.backing === 'aws' && this.s3) {
      const params: PutObjectRequest = {
        Body: createReadStream(sourcePath),
        Bucket: container,
        Key: file,
      }
      await this.s3.putObject(params).promise()
    }
    if (this.backing === 'local') {
      try {
        const bodyFormData = new FormData()
        bodyFormData.append('uploadFile', createReadStream(sourcePath))
        await axios.post(`http://127.0.0.1:9004/${file}`, bodyFormData, {
          headers: bodyFormData.getHeaders(),
        })
      } catch (error) {
        console.error(error.data)
        // throw error
      }
    }
  }
}
export default Storage
