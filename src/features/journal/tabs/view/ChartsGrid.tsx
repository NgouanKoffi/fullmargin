// src/pages/journal/tabs/view/ChartsGrid.tsx
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, ChartOrEmpty } from "./ui";

const COL = {
  grid: "#E2E8F0",
  win: "#10b981",
  loss: "#ef4444",
  buy: "#6366f1",
  sell: "#334155",
  respect: "#22c55e",
  noRespect: "#f43f5e",
};

type ChartsGridProps = {
  data: {
    equityPoints: Array<{ date: string; equity: number }>;
    gainsLosses: Array<{ name: string; Gains: number; Pertes: number }>;
    buySell: Array<{ name: string; value: number }>;
    byWeekday: Array<{ name: string; PnL: number }>;
    discipline: Array<{ name: string; value: number }>;
    byMarket: Array<{ name: string; Gains: number; Pertes: number }>;
    byStrategy: Array<{ name: string; Gains: number; Pertes: number }>;
  };
  currencySign: string; // on garde le type mais on ne l'utilise pas encore
};

export default function ChartsGrid(props: ChartsGridProps) {
  const { data } = props;
  const {
    equityPoints,
    gainsLosses,
    buySell,
    byWeekday,
    discipline,
    byMarket,
    byStrategy,
  } = data;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 px-4 lg:px-0">
      {/* 1. Equity curve */}
      <Card title="1. Évolution des gains/pertes">
        <ChartOrEmpty hasData={equityPoints.length > 0}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={equityPoints}
                margin={{ top: 10, right: 24, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke={COL.grid} strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="equity"
                  stroke={COL.win}
                  dot={false}
                  strokeWidth={2}
                  name="PnL cumul"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartOrEmpty>
      </Card>

      {/* 2. Gains vs pertes globaux */}
      <Card title="2. Gains vs Pertes">
        <ChartOrEmpty
          hasData={gainsLosses.some((x) => x.Gains > 0 || x.Pertes > 0)}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={gainsLosses}
                margin={{ top: 10, right: 24, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke={COL.grid} strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Gains" fill={COL.win} />
                <Bar dataKey="Pertes" fill={COL.loss} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartOrEmpty>
      </Card>

      {/* 3. Buy vs Sell */}
      <Card title="3. Répartition Buy vs Sell">
        <ChartOrEmpty hasData={buySell.some((x) => x.value > 0)}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip />
                <Pie
                  data={buySell}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={96}
                  label
                >
                  {buySell.map((s, i) => (
                    <Cell
                      key={s.name + i}
                      fill={s.name === "Buy" ? COL.buy : COL.sell}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartOrEmpty>
      </Card>

      {/* 4. PnL par jour de semaine */}
      <Card title="4. Résultat par jour de la semaine">
        <ChartOrEmpty hasData={byWeekday.some((x) => x.PnL !== 0)}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byWeekday}
                margin={{ top: 10, right: 24, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke={COL.grid} strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="PnL">
                  {byWeekday.map((d, i) => (
                    <Cell
                      key={d.name + i}
                      fill={d.PnL >= 0 ? COL.win : COL.loss}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartOrEmpty>
      </Card>

      {/* 5. Discipline */}
      <Card title="5. Discipline (respectée / non)">
        <ChartOrEmpty hasData={discipline.some((x) => x.value > 0)}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip />
                <Pie
                  data={discipline}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {discipline.map((s, i) => (
                    <Cell
                      key={s.name + i}
                      fill={
                        s.name === "Respectée" ? COL.respect : COL.noRespect
                      }
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartOrEmpty>
      </Card>

      {/* 6. Gains / Pertes par marché */}
      <Card title="6. Gains / Pertes par marché">
        <ChartOrEmpty
          hasData={byMarket.some((x) => x.Gains !== 0 || x.Pertes !== 0)}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byMarket}
                margin={{ top: 10, right: 24, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke={COL.grid} strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Gains" fill={COL.win} />
                <Bar dataKey="Pertes" fill={COL.loss} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartOrEmpty>
      </Card>

      {/* 7. Gains / Pertes par stratégie */}
      <Card title="7. Gains / Pertes par stratégie">
        <ChartOrEmpty
          hasData={byStrategy.some((x) => x.Gains !== 0 || x.Pertes !== 0)}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byStrategy}
                margin={{ top: 10, right: 24, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke={COL.grid} strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Gains" fill={COL.win} />
                <Bar dataKey="Pertes" fill={COL.loss} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartOrEmpty>
      </Card>
    </div>
  );
}
