import React from 'react'
import { Bar } from 'react-chartjs-2'
import { Chart, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'

Chart.register(CategoryScale, LinearScale, BarElement, Tooltip)

export default function ThreadsSummaryChart({ tenants, threads }) {
  const dataPerTenant = tenants.map(t => ({
    name: t.name,
    count: threads.filter(th => th.tenant_id === t.id).length
  }))

  const data = {
    labels: dataPerTenant.map(d => d.name),
    datasets: [
      {
        label: 'Open Threads',
        data: dataPerTenant.map(d => d.count),
        backgroundColor: 'rgba(0, 123, 255, 0.5)'
      }
    ]
  }

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false }
    }
  }

  return (
    <div className="section-card" style={{ marginBottom: '2rem' }}>
      <div className="card-header">Threads Summary</div>
      <div className="card-body">
        <Bar data={data} options={options} />
      </div>
    </div>
  )
}
