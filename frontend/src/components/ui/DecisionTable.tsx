import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Decision } from '@/types';

const priorityStyles = {
  high: 'bg-red-400/20 text-red-600 border-red-400/30 hover:bg-red-400/30 transition-colors',
  medium: 'bg-blue-400/20 text-blue-600 border-blue-400/30 hover:bg-blue-400/30 transition-colors',
  low: 'bg-gray-400/20 text-gray-600 border-gray-400/30 hover:bg-gray-400/30 transition-colors',
};

const statusStyles = {
  active: 'bg-green-400/20 text-green-600 border-green-400/30 hover:bg-green-400/30 transition-colors',
  completed: 'bg-blue-400/20 text-blue-600 border-blue-400/30 hover:bg-blue-400/30 transition-colors',
  pending: 'bg-yellow-400/20 text-yellow-600 border-yellow-400/30 hover:bg-yellow-400/30 transition-colors',
};

interface DecisionTableProps {
  decisions: Decision[];
}

export function DecisionTable({ decisions }: DecisionTableProps) {
  return (
    <div className="glass-card p-4 rounded-xl">
      <Table>
        <TableHeader>
          <TableRow className="border-gray-300/50 hover:bg-gray-50/30 transition-colors">
            <TableHead className="text-gray-700 font-semibold text-sm">Decision</TableHead>
            <TableHead className="text-gray-700 font-semibold text-sm">Priority</TableHead>
            <TableHead className="text-gray-700 font-semibold text-sm">Status</TableHead>
            <TableHead className="text-gray-700 font-semibold text-sm">Confidence</TableHead>
            <TableHead className="text-gray-700 font-semibold text-sm">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {decisions.map((decision) => (
            <TableRow 
              key={decision.id} 
              className="hover:bg-gray-50/50 border-gray-200/50 transition-all duration-300 cursor-pointer group"
            >
              <TableCell className="font-medium text-black group-hover:text-gray-800 transition-colors">
                {decision.title}
              </TableCell>
              <TableCell>
                <Badge className={`${priorityStyles[decision.priority]} group-hover:scale-105 transition-transform`}>
                  {decision.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={`${statusStyles[decision.status]} group-hover:scale-105 transition-transform`}>
                  {decision.status}
                </Badge>
              </TableCell>
              <TableCell className="text-black group-hover:text-gray-800 transition-colors font-medium">
                {decision.confidence}%
              </TableCell>
              <TableCell className="text-gray-600 group-hover:text-gray-700 transition-colors">
                {new Date(decision.createdAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}