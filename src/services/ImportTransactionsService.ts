/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
import csvParse from 'csv-parse';
import path from 'path';
import fs from 'fs';

import uploadConfig from '../config/upload';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';

interface Request {
  fileName: string;
}

interface TransactionDTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

enum transactionProps {
  TITLE = 0,
  TYPE = 1,
  VALUE = 2,
  CATEGORY = 3,
}

class ImportTransactionsService {
  async execute({ fileName }: Request): Promise<Transaction[]> {
    const transactions = new Array<Transaction>();
    const transactionsFilePath = path.join(uploadConfig.directory, fileName);
    const transactionsFileExists = await fs.promises.stat(transactionsFilePath);

    if (!transactionsFileExists)
      throw new AppError('Internal server error.', 500);

    async function loadCSV(filePath: string): Promise<TransactionDTO[]> {
      const transactionsDTO = new Array<TransactionDTO>();
      const readCSVStream = fs.createReadStream(filePath);

      const parseStream = csvParse({
        from_line: 2,
        ltrim: true,
        rtrim: true,
      });

      const parseCSV = readCSVStream.pipe(parseStream);

      parseCSV.on('data', line => {
        const transaction = {
          title: line[transactionProps.TITLE],
          type: line[transactionProps.TYPE],
          value: line[transactionProps.VALUE],
          category: line[transactionProps.CATEGORY],
        };
        transactionsDTO.push(transaction);
      });

      await new Promise(resolve => {
        parseCSV.on('end', resolve);
      });

      return transactionsDTO;
    }

    const data = await loadCSV(transactionsFilePath);

    const createTransactionService = new CreateTransactionService();
    for (let index = 0; index < data.length; index++) {
      const transaction = await createTransactionService.execute({
        title: data[index].title,
        type: data[index].type,
        value: data[index].value,
        category: data[index].category,
      });

      transactions.push(transaction);
    }

    return transactions;
  }
}

export default ImportTransactionsService;
