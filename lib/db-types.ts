/** 투표 모듈이 DB에 기대하는 전부: SQL 한 문장과 파라미터를 보내고 행을 받는다. */
export type Db = {
  query<Row = Record<string, unknown>>(text: string, params?: unknown[]): Promise<Row[]>;
};
