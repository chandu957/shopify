const SimpleBarChart = ({ title, data = [], color = 'bg-blue-500' }) => {
  const maxValue = Math.max(...data.map((d) => d.value || 0), 1)

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">{item.label}</span>
              <span className="font-semibold">{item.value}</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${color}`}
                style={{ width: `${Math.max((item.value / maxValue) * 100, 4)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SimpleBarChart

