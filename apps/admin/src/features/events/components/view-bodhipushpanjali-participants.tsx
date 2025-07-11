import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { CheckIcon, Cross1Icon, Pencil1Icon } from '@radix-ui/react-icons';


interface ViewBodhipushpanjaliParticipantProps {
  participants: Array<{ 
    id: string; 
    name: string; 
    firstName?: string;
    lastName?: string;
    referralMedium?: string;
  }>;
  filteredParticipants: Array<{ 
    id: string; 
    name: string;
    referralMedium?: string;
  }>;
  onRemove: (id: string) => void;
  onUpdate: (id: string, data: { referralMedium?: string }) => void;
}

export function ViewBodhipushpanjaliParticipants({
  participants,
  filteredParticipants,
  onRemove,
  onUpdate
}: ViewBodhipushpanjaliParticipantProps) {
  // Track which participant is being edited and the edited values
  const [editingState, setEditingState] = useState<Record<string, { 
    isEditing: boolean, 
    referralMedium: string
  }>>({});
  
  // Initialize editing state
  const getParticipantEditState = (personId: string) => {
    if (!editingState[personId]) {
      const participant = participants.find(p => p.id === personId);
      setEditingState(prev => ({
        ...prev,
        [personId]: {
          isEditing: false,
          referralMedium: participant?.referralMedium || ''
        }
      }));
    }
    return editingState[personId] || { isEditing: false, referralMedium: '' };
  };

  // Start editing a participant's referral medium
  const startEditing = (personId: string) => {
    const participant = participants.find(p => p.id === personId);
    setEditingState(prev => ({
      ...prev,
      [personId]: {
        isEditing: true,
        referralMedium: participant?.referralMedium || ''
      }
    }));
  };

  // Cancel editing
  const cancelEditing = (personId: string) => {
    const participant = participants.find(p => p.id === personId);
    setEditingState(prev => ({
      ...prev,
      [personId]: {
        isEditing: false,
        referralMedium: participant?.referralMedium || ''
      }
    }));
  };

  // Update edited value
  const handleReferralMediumChange = (personId: string, value: string) => {
    setEditingState(prev => ({
      ...prev,
      [personId]: {
        ...prev[personId],
        referralMedium: value
      }
    }));
  };

  // Save the edited referral medium
  const saveReferralMedium = (personId: string) => {
    const editState = editingState[personId];
    if (!editState) return;
    
    onUpdate(personId, { referralMedium: editState.referralMedium });
    
    // Update edit state
    setEditingState(prev => ({
      ...prev,
      [personId]: {
        ...prev[personId],
        isEditing: false
      }
    }));
  };


  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Referral Medium</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredParticipants.length > 0 ? (
            filteredParticipants.map(participant => {
              const { isEditing, referralMedium } = getParticipantEditState(participant.id);
              
              return (
                <TableRow key={participant.id}>
                  <TableCell className="py-1.5">{participant.name}</TableCell>
                  <TableCell className="py-1.5">
                    {isEditing ? (
                      <div className="flex space-x-2">
                        <Input
                          value={referralMedium}
                          onChange={(e) => handleReferralMediumChange(participant.id, e.target.value)}
                          className="h-8 w-full"
                          autoFocus
                        />
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => saveReferralMedium(participant.id)}
                          >
                            <CheckIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => cancelEditing(participant.id)}
                          >
                            <Cross1Icon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span>{participant.referralMedium || '-'}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-50 hover:opacity-100"
                          onClick={() => startEditing(participant.id)}
                        >
                          <Pencil1Icon className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right py-1.5">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onRemove(participant.id)}
                      className="h-7 px-2 text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-3 text-sm text-muted-foreground">
                No matching participants found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}