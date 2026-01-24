import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
        },
    },
});

export const queryKeys = {
    callRecordings: {
        latest: (userId: string) => ['callRecordings', 'latest', userId],
        list: (userId: string, limit: number, offset: number) => ['callRecordings', 'list', userId, limit, offset],
    },
    // Add other keys as needed based on usage
};
