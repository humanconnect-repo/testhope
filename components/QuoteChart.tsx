"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface QuoteChartProps {
  yesPercentage: number;
  noPercentage: number;
  totalBetsAmount: number;
  betCount: number;
  yesBetsCount?: number;
  noBetsCount?: number;
  yesBetsAmount?: number;
  noBetsAmount?: number;
}

export default function QuoteChart({ 
  yesPercentage, 
  noPercentage, 
  totalBetsAmount, 
  betCount,
  yesBetsCount,
  noBetsCount,
  yesBetsAmount = 0,
  noBetsAmount = 0
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
            <div className="text-xs text-gray-600 dark:text-gray-400">Predictions</div>
          </div>
        </div>
        
        {/* Percentuali Sì/No con conteggi */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Sì</span>
            </div>
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {yesPercentage.toFixed(1)}%
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              {yesBetsCount || Math.round((yesPercentage / 100) * betCount)} {yesBetsCount === 1 || (yesBetsCount === undefined && Math.round((yesPercentage / 100) * betCount) === 1) ? 'Prediction' : 'Predictions'}
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-red-700 dark:text-red-300">No</span>
            </div>
            <div className="text-xl font-bold text-red-600 dark:text-red-400">
              {noPercentage.toFixed(1)}%
            </div>
            <div className="text-xs text-red-600 dark:text-red-400">
              {noBetsCount || Math.round((noPercentage / 100) * betCount)} {noBetsCount === 1 || (noBetsCount === undefined && Math.round((noPercentage / 100) * betCount) === 1) ? 'Prediction' : 'Predictions'}
            </div>
          </div>
        </div>

        {/* Volumi Sì/No (sotto i riquadri percentuali, sopra il grafico) */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
            <div className="text-xs uppercase tracking-wide text-green-600 dark:text-green-400">Volumi per il Sì</div>
            <div className="text-base font-bold text-green-600 dark:text-green-400">{yesBetsAmount.toFixed(4)} BNB</div>
            <div className="text-xs text-green-600 dark:text-green-400">{totalBetsAmount > 0 ? ((yesBetsAmount / totalBetsAmount) * 100).toFixed(1) : '0.0'}%</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
            <div className="text-xs uppercase tracking-wide text-red-600 dark:text-red-400">Volumi per il No</div>
            <div className="text-base font-bold text-red-600 dark:text-red-400">{noBetsAmount.toFixed(4)} BNB</div>
            <div className="text-xs text-red-600 dark:text-red-400">{totalBetsAmount > 0 ? ((noBetsAmount / totalBetsAmount) * 100).toFixed(1) : '0.0'}%</div>
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