import * as path from 'path'
import { promises as fs } from 'fs'
import logger from '../logger'
import { BaseKeyvalue } from '../../typings'

interface KeyValueLocalProps {
  name: string
}

// this is designed to be slow af to emulate the dynamoDB lag
const filePath = path.join(__dirname, '../../cache/keyvalue-')
class KeyvalueLocal extends BaseKeyvalue {
  constructor(props: KeyValueLocalProps) {
    super()
    const { name } = props
    this.name = name
  }

  read = async () => {
    const { name } = this
    try {
      const content = await fs.readFile(`${filePath}${name}.json`)
      const jsonstring = content.toString()
      const data = JSON.parse(jsonstring)
      return data
    } catch (err) {
      return {}
    }
  }

  write = async (data: any) => {
    const { name } = this
    await fs.writeFile(`${filePath}${name}.json`, JSON.stringify(data, ' ', 2))
  }

  get = async (key: string) => {
    const data = await this.read()
    const value = data[key]
    return value || {}
  }

  set = async (key: string, value: any) => {
    const data = await this.read()
    data[key] = value
    try {
      await this.write(data)
      return true
    } catch (err) {
      logger.error({ err }, 'Could not write data.')
      return false
    }
  }

  delete = async (key: string) => {
    const data = await this.read()
    delete data[key]
    try {
      await this.write(data)
      return true
    } catch (err) {
      logger.error({ err }, 'Could not write data.')
      return false
    }
  }

  scan = async () => {
    const data = await this.read()
    return data
  }
}
export default KeyvalueLocal
