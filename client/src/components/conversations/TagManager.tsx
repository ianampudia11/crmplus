
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import { Plus, X, Tag as TagIcon, Check } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface TagManagerProps {
    contactId: number;
    initialTags: string[];
    readOnly?: boolean;
}

export function TagManager({ contactId, initialTags = [], readOnly = false }: TagManagerProps) {
    const [tags, setTags] = useState<string[]>(initialTags);
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    useEffect(() => {
        setTags(initialTags || []);
    }, [initialTags]);

    const { data: availableTags = [] } = useQuery({
        queryKey: ['/api/contacts/tags'],
        queryFn: async () => {
            const res = await fetch('/api/contacts/tags');
            if (!res.ok) return [];
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        },
        staleTime: 60000, // Cache for 1 minute
    });

    const updateTagsMutation = useMutation({
        mutationFn: async (newTags: string[]) => {
            const response = await apiRequest('PATCH', `/api/contacts/${contactId}`, {
                tags: newTags,
            });
            if (!response.ok) {
                throw new Error('Failed to update tags');
            }
            return response.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['/api/contacts', contactId] });
            queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
            // Update local available tags if we added a new one
            queryClient.invalidateQueries({ queryKey: ['/api/contacts/tags'] });
        },
        onError: () => {
            toast({
                title: t('common.error', 'Error'),
                description: t('tags.update_failed', 'Failed to update tags'),
                variant: 'destructive',
            });
            // Revert on error
            setTags(initialTags);
        },
    });

    const handleToggleTag = (tag: string) => {
        const normalizedTag = tag.trim();
        if (!normalizedTag) return;

        let newTags: string[];
        if (tags.includes(normalizedTag)) {
            newTags = tags.filter((t) => t !== normalizedTag);
        } else {
            newTags = [...tags, normalizedTag];
        }

        setTags(newTags); // Optimistic update
        updateTagsMutation.mutate(newTags);
    };

    const handleCreateTag = () => {
        if (!searchValue.trim()) return;
        handleToggleTag(searchValue.trim());
        setSearchValue('');
    };

    const filteredAvailableTags = availableTags.filter((tag: string) =>
        !tags.includes(tag) && tag.toLowerCase().includes(searchValue.toLowerCase())
    );

    if (readOnly) {
        return (
            <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="px-1.5 py-0 text-xs">
                        {tag}
                    </Badge>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-wrap items-center gap-1.5 align-middle">
            {tags.map((tag) => (
                <Badge
                    key={tag}
                    variant="secondary"
                    className="px-2 py-0.5 text-xs h-6 flex items-center gap-1 hover:bg-secondary/80"
                >
                    {tag}
                    <div
                        role="button"
                        className="ml-0.5 cursor-pointer rounded-full p-0.5 hover:bg-secondary-foreground/10"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTag(tag);
                        }}
                    >
                        <X className="h-3 w-3" />
                    </div>
                </Badge>
            ))}

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 text-xs text-muted-foreground hover:bg-secondary/50 rounded-full"
                        aria-label={t('tags.add', 'Add Tag')}
                    >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        <span className="hidden sm:inline">{t('tags.add_btn', 'Tag')}</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                    <Command>
                        <CommandInput
                            placeholder={t('tags.search', 'Search tags...')}
                            value={searchValue}
                            onValueChange={setSearchValue}
                        />
                        <CommandList>
                            <CommandEmpty>
                                {searchValue && (
                                    <div
                                        className="p-2 text-xs cursor-pointer hover:bg-accent flex items-center gap-2"
                                        onClick={handleCreateTag}
                                    >
                                        <Plus className="h-3 w-3" />
                                        {t('tags.create', 'Create')} "{searchValue}"
                                    </div>
                                )}
                            </CommandEmpty>

                            <CommandGroup heading={t('tags.selected', 'Selected')}>
                                {tags.map(tag => (
                                    <CommandItem
                                        key={tag}
                                        value={tag}
                                        onSelect={() => handleToggleTag(tag)}
                                        className="bg-accent/50"
                                    >
                                        <Check className="mr-2 h-4 w-4 opacity-100" />
                                        {tag}
                                    </CommandItem>
                                ))}
                            </CommandGroup>

                            {filteredAvailableTags.length > 0 && (
                                <>
                                    <CommandSeparator />
                                    <CommandGroup heading={t('tags.available', 'Available')}>
                                        {filteredAvailableTags.map((tag: string) => (
                                            <CommandItem
                                                key={tag}
                                                value={tag}
                                                onSelect={() => handleToggleTag(tag)}
                                            >
                                                <TagIcon className="mr-2 h-3.5 w-3.5 opacity-70" />
                                                {tag}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
