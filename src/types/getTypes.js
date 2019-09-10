import { sortBy } from 'lodash'
import isQueryValue from '../util/isQueryValue'
import * as schemaTypes from './'
import * as functions from './functions'
import toSchemaType from './toSchemaType'

const getValueTypes = (v) =>
  sortBy(Object.entries(schemaTypes).reduce((prev, [ type, desc ]) => {
    if (!desc || typeof desc.check !== 'function') return prev
    if (desc.check(v)) prev.push({ type })
    return prev
  }, []))

const getJSONTypes = (fieldPath, { model, subSchemas = {} }) => {
  const path = fieldPath.split('.')
  const col = path.shift()
  const colInfo = model.rawAttributes[col]
  if (!colInfo) return []
  const schema = subSchemas[col] || colInfo.subSchema
  if (!schema) return []
  const field = path[0]
  const attrDef = schema[field]
  if (!attrDef) return []
  const desc = schemaTypes[attrDef.type]
  if (!desc) return []
  return [ { type: attrDef.type, measurement: attrDef.measurement, items: attrDef.items } ]
}

const getFieldTypes = (fieldPath, { model }) => {
  const desc = model.rawAttributes[fieldPath]
  if (!desc) return []
  return [ toSchemaType(desc.type) ]
}

// return empty on any invalid condition, `parse` will handle main validation before this function is called
const getTypes = (v, opt) => {
  if (!isQueryValue(v)) return getValueTypes(v)
  if (v.function) {
    const fn = functions[v.function]
    if (!fn) return []
    // dynamic return type based on inputs
    if (typeof fn.returns === 'function') {
      const sigArgs = fn.signature || []
      const args = v.arguments || []
      const resolvedArgs = sigArgs.map((sig, idx) => {
        const nopt = {
          ...opt,
          context: [ ...opt.context, 'arguments', idx ]
        }
        const argValue = args[idx]
        return {
          types: getTypes(argValue, nopt),
          raw: argValue
        }
      })
      return [ fn.returns(...resolvedArgs) ]
    }
    return [ fn.returns ]
  }
  if (v.field) {
    if (typeof v.field !== 'string') return []
    if (v.field.includes('.')) return getJSONTypes(v.field, opt)
    return getFieldTypes(v.field, opt)
  }
  return []
}

export default getTypes