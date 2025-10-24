"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface QuoteChartProps {
  yesPercentage: number;
  noPercentage: number;
  totalBetsAmount: number;
  betCount: number;
}

export default function QuoteChart({ 
  yesPercentage, 
  noPercentage, 
  totalBetsAmount, 
  betCount 
}: QuoteChartProps) {
  // Mostra solo i dati attuali se non ci sono scommesse storiche
  const chartData = betCount > 0 ? [
    { time: 'Attuale', yes: yesPercentage, no: noPercentage }
  ] : [
    { time: 'Nessuna scommessa', yes: 0, no: 0 }
  ];

  return (
    <div className="w-full">
      <div className="mb-8">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalBetsAmount.toFixed(4)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">BNB Totali</div>
          </div>
          <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {betCount}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Scommesse</div>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        {betCount > 0 ? (
          <div className="space-y-4">
            {/* Grafico centrato - nascosto su mobile */}
            <div className="hidden sm:block w-full h-64 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart 
                  data={chartData} 
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#6b7280"
                    fontSize={10}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={10}
                    domain={[0, 100]}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="yes" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="no" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Pannello Quote Attuali - sempre visibile */}
            <div className="flex justify-center">
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 text-center">
                  📊 Quote
                </h4>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Sì</span>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      {yesPercentage.toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({Math.round((yesPercentage / 100) * betCount)})
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">No</span>
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">
                      {noPercentage.toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({Math.round((noPercentage / 100) * betCount)})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-gray-600 dark:text-gray-400">
                Nessuna scommessa ancora
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Il grafico apparirà quando ci saranno scommesse
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}