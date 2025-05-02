import React from 'react';
import { PreviewData } from '@/lib/import/field-mapping-types';

interface TransactionPreviewProps {
  previewData: PreviewData;
}

export const TransactionPreview: React.FC<TransactionPreviewProps> = ({ previewData }) => {
  const { rawData, mappedTransactions } = previewData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Transaction Preview</h2>

      {/* Original CSV Data */}
      <div className="border p-4 rounded-md">
        <h3 className="font-medium mb-4">Original CSV Data</h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {rawData && rawData.length > 0 ? Object.keys(rawData[0]).map(header => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                )) : null}
              </tr>
            </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rawData && rawData.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, i) => (
                      <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
          </table>
        </div>
      </div>

      {/* Mapped Transactions */}
      <div className="border p-4 rounded-md">
        <h3 className="font-medium mb-4">Mapped Transactions</h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account
                </th>
              </tr>
            </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mappedTransactions && mappedTransactions.map((transaction, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.description}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      transaction.type === 'expense' ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {transaction.type === 'expense' ? '-' : '+'}{transaction.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.categoryId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.accountId}
                    </td>
                  </tr>
                ))}
              </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
