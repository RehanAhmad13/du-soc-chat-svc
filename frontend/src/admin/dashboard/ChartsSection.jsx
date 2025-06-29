export default function ChartsSection({ stats }) {
  // Mock data for charts - in real implementation, this would come from API
  const threadTrend = [
    { day: 'Mon', threads: 12 },
    { day: 'Tue', threads: 19 },
    { day: 'Wed', threads: 8 },
    { day: 'Thu', threads: 15 },
    { day: 'Fri', threads: 22 },
    { day: 'Sat', threads: 7 },
    { day: 'Sun', threads: 4 }
  ]

  const slaByTenant = [
    { tenant: 'Alpha Corp', compliance: 92 },
    { tenant: 'Beta LLC', compliance: 85 },
    { tenant: 'Gamma Inc', compliance: 78 },
    { tenant: 'Delta Co', compliance: 94 }
  ]

  const responseTimeData = [
    { hour: '00:00', time: 3.2 },
    { hour: '04:00', time: 2.8 },
    { hour: '08:00', time: 5.1 },
    { hour: '12:00', time: 6.2 },
    { hour: '16:00', time: 4.7 },
    { hour: '20:00', time: 3.9 }
  ]

  return (
    <div className="charts-section">
      <div className="charts-grid">
        
        {/* Thread Creation Timeline */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Thread Creation Timeline</h3>
            <p>Last 7 days</p>
          </div>
          <div className="chart-content">
            <div className="simple-line-chart">
              {threadTrend.map((point, index) => (
                <div key={index} className="chart-point">
                  <div 
                    className="chart-bar"
                    style={{ height: `${(point.threads / 25) * 100}%` }}
                  ></div>
                  <span className="chart-label">{point.day}</span>
                  <span className="chart-value">{point.threads}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SLA Compliance by Tenant */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>SLA Compliance by Tenant</h3>
            <p>Current period</p>
          </div>
          <div className="chart-content">
            <div className="horizontal-bar-chart">
              {slaByTenant.map((item, index) => (
                <div key={index} className="bar-item">
                  <div className="bar-label">{item.tenant}</div>
                  <div className="bar-container">
                    <div 
                      className="bar-fill"
                      style={{ 
                        width: `${item.compliance}%`,
                        backgroundColor: item.compliance >= 90 ? '#28a745' : 
                                       item.compliance >= 80 ? '#ffc107' : '#dc3545'
                      }}
                    ></div>
                    <span className="bar-value">{item.compliance}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Response Time Trends */}
        <div className="chart-card chart-card-wide">
          <div className="chart-header">
            <h3>Response Time Trends</h3>
            <p>Average response time by hour</p>
          </div>
          <div className="chart-content">
            <div className="area-chart">
              {responseTimeData.map((point, index) => (
                <div key={index} className="area-point">
                  <div 
                    className="area-bar"
                    style={{ height: `${(point.time / 8) * 100}%` }}
                  ></div>
                  <span className="area-label">{point.hour}</span>
                  <span className="area-value">{point.time}h</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Template Usage Stats */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Template Usage</h3>
            <p>Most used templates</p>
          </div>
          <div className="chart-content">
            <div className="template-stats">
              {[
                { name: 'Security Incident', count: 45, color: '#dc3545' },
                { name: 'Network Issue', count: 32, color: '#007bff' },
                { name: 'System Alert', count: 28, color: '#28a745' },
                { name: 'User Access', count: 19, color: '#ffc107' }
              ].map((template, index) => (
                <div key={index} className="template-item">
                  <div className="template-info">
                    <span 
                      className="template-dot"
                      style={{ backgroundColor: template.color }}
                    ></span>
                    <span className="template-name">{template.name}</span>
                  </div>
                  <span className="template-count">{template.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}