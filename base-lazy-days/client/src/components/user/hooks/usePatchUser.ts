import { useMutation, UseMutateFunction, useQueryClient } from 'react-query';
import jsonpatch from 'fast-json-patch';
import type { User } from '../../../../../shared/types';
import { axiosInstance, getJWTHeader } from '../../../axiosInstance';
import { useUser } from './useUser';
import { useCustomToast } from 'components/app/hooks/useCustomToast';
import { queryKeys } from 'react-query/constants';

// for when we need a server function
async function patchUserOnServer(
  newData: User | null,
  originalData: User | null,
): Promise<User | null> {
  if (!newData || !originalData) return null;
  // create a patch for the difference between newData and originalData
  const patch = jsonpatch.compare(originalData, newData);

  // send patched data to the server
  const { data } = await axiosInstance.patch(
    `/user/${originalData.id}`,
    { patch },
    {
      headers: getJWTHeader(originalData),
    },
  );
  return data.user;
}

export function usePatchUser(): (newData: User | null) => void {
  const { user, updateUser } = useUser();
  const toast = useCustomToast();
  const queryClient = useQueryClient();

  const { mutate: patchUser } = useMutation(
    (newUser: User) => patchUserOnServer(newUser, user),
    {
      // onMutate returns ctx that is passed to onError
      onMutate: async (newData: User | null) => {
        // cancel any outgoing quries for user data, so old server data doesn't overwrite our optimistic update
        queryClient.cancelQueries(queryKeys.user);

        // snapshot of prev user value
        const prevUserData: User = queryClient.getQueryData(queryKeys.user);

        // optimistically update the cache w/ the new value
        updateUser(newData);

        // return context obj w/ snapshotted value
        return { prevUserData };
      },
      onError: (error, newData, ctx) => {
        // rollback cache to saved value
        if (ctx.prevUserData) {
          updateUser(ctx.prevUserData);
          toast({
            title: 'Update failed; restoring previous values',
            status: 'warning',
          });
        }
      },
      onSuccess: (userData: User | null) => {
        if (user) {
          toast({
            title: 'User updated',
            status: 'success',
          });
        }
      },
      onSettled: () => {
        // invalidate user query to make sure w're in sync w/ server data
        queryClient.invalidateQueries(queryKeys.user);
      },
    },
  );

  return patchUser;
}
