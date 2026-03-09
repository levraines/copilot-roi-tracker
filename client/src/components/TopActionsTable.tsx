interface Action {
  actionName: string;
  agentName: string;
  count: number;
  timeSaved: number;
  moneySaved: number;
}

interface Props {
  actions: Action[];
}

export function TopActionsTable({ actions }: Props) {
  if (actions.length === 0) {
    return <div className="h-64 flex items-center justify-center text-gray-400">No data</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 px-3 font-medium text-gray-500">#</th>
            <th className="text-left py-2 px-3 font-medium text-gray-500">Action</th>
            <th className="text-left py-2 px-3 font-medium text-gray-500">Agent</th>
            <th className="text-right py-2 px-3 font-medium text-gray-500">Uses</th>
            <th className="text-right py-2 px-3 font-medium text-gray-500">Min Saved</th>
            <th className="text-right py-2 px-3 font-medium text-gray-500">$ Saved</th>
          </tr>
        </thead>
        <tbody>
          {actions.map((a, i) => (
            <tr key={i} className="border-b border-gray-50">
              <td className="py-2 px-3 text-gray-400">{i + 1}</td>
              <td className="py-2 px-3 font-medium">{a.actionName}</td>
              <td className="py-2 px-3 text-gray-600">{a.agentName}</td>
              <td className="py-2 px-3 text-right">{a.count}</td>
              <td className="py-2 px-3 text-right text-green-700">{Math.round(a.timeSaved).toLocaleString()}</td>
              <td className="py-2 px-3 text-right font-medium text-green-700">${a.moneySaved.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
