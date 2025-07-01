import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'

const data = [
  {
    name: 'Jan',
    users: Math.floor(Math.random() * 50) + 10,
  },
  {
    name: 'Feb',
    users: Math.floor(Math.random() * 50) + 10,
  },
  {
    name: 'Mar',
    users: Math.floor(Math.random() * 50) + 10,
  },
  {
    name: 'Apr',
    users: Math.floor(Math.random() * 50) + 10,
  },
  {
    name: 'May',
    users: Math.floor(Math.random() * 50) + 10,
  },
  {
    name: 'Jun',
    users: Math.floor(Math.random() * 50) + 10,
  },
  {
    name: 'Jul',
    users: Math.floor(Math.random() * 50) + 10,
  },
  {
    name: 'Aug',
    users: Math.floor(Math.random() * 50) + 10,
  },
  {
    name: 'Sep',
    users: Math.floor(Math.random() * 50) + 10,
  },
  {
    name: 'Oct',
    users: Math.floor(Math.random() * 50) + 10,
  },
  {
    name: 'Nov',
    users: Math.floor(Math.random() * 50) + 10,
  },
  {
    name: 'Dec',
    users: Math.floor(Math.random() * 50) + 10,
  },
]

export function UsersOverview() {
  return (
    <ResponsiveContainer width='100%' height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey='name'
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Bar
          dataKey='users'
          fill='currentColor'
          radius={[4, 4, 0, 0]}
          className='fill-primary'
        />
      </BarChart>
    </ResponsiveContainer>
  )
}