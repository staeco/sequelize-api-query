import should from 'should'
import { Connection, AnalyticsQuery } from '../../src'
import db from '../fixtures/db'

describe('AnalyticsQuery', () => {
  const conn = new Connection(db)
  const { user } = conn.tables()
  it('should blow up on invalid options', async () => {
    should.throws(() => new AnalyticsQuery({ limit: 1, groupings: [ { field: 'name' } ] }, { table: null }))
    should.throws(() => new AnalyticsQuery({ limit: 1, groupings: [ { field: 'name' } ] }))
    should.throws(() => new AnalyticsQuery(null, { table: user }))
    should.throws(() => new AnalyticsQuery({ limit: 1 }, { table: user }))
  })
})