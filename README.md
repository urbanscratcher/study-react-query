# 리액트 쿼리 공부자료

- 유데미 강의 들으면서 작성한 코드
- [React Query: Server State Management in React](https://www.udemy.com/course/learn-react-query/?couponCode=REACT-QUERY-GITHUB)

## 리액트 쿼리 (@tanstack/react-query) 요약/정리

- What problem does RQ solve?
  - 서버 상태 가져오기, 캐싱, 동기화, 업데이트
  - **클라이언트의 서버 데이터 캐시를 관리 (서버 상태 관리 툴)**
  - 캐시를 **언제 or 어떤 조건에서** 업데이트할 지 알려주면 됨 (declaratively)
  - 기존 상태 관리 라이브러리는 클라이언트 상태 관리에 적합하지만, 비동기 및 서버 작업에는 X. 서버 상태가 전혀 다르기 때문.
  - 서버 상태 특성
    - 원격으로 지속됨
    - fetching 및 업데이트를 위한 비동기 API가 필요
    - 공유되기 때문에 타인이 변경 가능
  - 서버 상태 특성에 따른 문제
    - 캐싱
    - 동일 데이터에 대한 여러 요청을 단일 요청으로 중복 제거
    - 백그라운드에서 오래된 데이트 업데이트
    - 데이터가 얼마나 오래됐는지 알기
    - 최대한 빠르게 데이터 업데이트 반영
    - 패이지네이션, 지연 로딩 데이터 등의 성능 최적화
    - 서버 상태의 메모리 관리
    - 구조적 공유를 통한 쿼리 결과 메모
  - 주요 기능
    - Loading/error states
    - Pagination/infinite scroll
    - Prefetching data
    - Mutation (Update)
    - 중복 요청 제거
    - 에러 발생시 리퀘스트 재시도
    - 콜백
- 설치
  ```jsx
  pnpm i @tanstack/react-query@4
  pnpm i @tanstack/react-query-devtools
  ```
- 기본 설정 (App.jsx)
  ```jsx
  import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
  import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

  const **queryClient** = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });

  function App() {
    return (
      **<QueryClientProvider client={queryClient}>
        <ReactQueryDevtools initialIsOpen={false} />**
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
          </Routes>
        </BrowserRouter>
      **</QueryClientProvider>**
    );
  }
  ```
  - `QueryClient` 쿼리와 서버의 데이터 캐시를 관리하는 클라이언트
  - `QueryClientProvider` 자녀 컴포넌트에 캐시 & 클라이언트 구성 제공
  - `ReactQueryDevtools` 쿼리키로 쿼리 표시, active, inactive, stale 등 모든 쿼리 상태 알려줌
    - 쿼리 key를 통해 쿼리를 보여줌: 쿼리 상태, 마지막 업데이트된 시간
    - 데이터, 쿼리 explorer
    - node_env === ‘production’일 때는 자동으로 미포함됨
    - `stale` RQ는 데이터 만료시에만 해당 데이터를 refetching 함. window 포커싱이 나갔다거나, 컴포넌트가 unmount 됐다거나 할 때 stale 상태로 전환하고, data refetching이 가능해 짐
    - `staleTime` 기본은 0, 2로 설정하는 2초 동안 fresh 상태 지속. refetching 실행되더라도 데이터가 stale 상태가 아니라면 refetching이 일어나지 않음. staleTime 지정을 통해 무분별한 데이터 fetching 방지 가능
    - `staleTime` vs. `cacheTime`
      - `cacheTime` how long it’s been since the last active useQuery. 최신상태 유지가 중요하면 0
      - 캐시는 나중에 다시 필요할 수 있는 데이터. 캐시가 만료되면 가비지 컬렉션이 실행돼 클라이언트는 해당 데이터를 사용할 수 없음. 데이터가 캐시에 있는 동안 fetching할 때 사용 가능.
- 읽기 (useQuery)
  ```jsx
  function CabinTable() {
    const {
      data: cabins,
  		isSuccess,
      isPending,
  		isError,
      error
    } = useQuery({
  		// 개별적으로 구별되는 쿼리를 만들려면 id 같은 것을 넣어줘야 함
      queryKey: ["cabin", cabin.id],
      queryFn: getCabins, // async function
  		enabled: (expression)
    });

    if (isLoading) return <Spinner />;

    return (
        {cabins.map((c) => (
          <CabinRow cabin={c} key={c.id} />
        ))}
    );
  }
  ```
  - `useQuery` 컴포넌트나 커스텀 훅에서 어떤 쿼리를 subscribe하는 훅
    - `queryKey` 해당 쿼리의 고유키. 내부적으로 refetching, 캐싱, 쿼리 공유에 사용
    - `queryFn` 비동기 함수.
  - 리턴 값 - 쿼리 상태(기본)
    - `isPending` 쿼리가 아직 데이터를 가져오지 못했을 때
    - `isError` 쿼리가 에러를 마주쳤을 때. RQ는 기본적으로 3번 retry
    - `isSuccess` 쿼리가 성공적으로 데이터를 가져와서 데이터 사용이 가능할 때
  - 리턴 값 - 그외
    - `error` 쿼리가 isError 상태일 때 사용 가능
    - `data` 쿼리가 isSuccess 상태일 때 사용 가능
    - `isFetching` 어떤 상태이든, 쿼리가 fetching 중이라면 언제든 true 값을 가짐 (백그라운드 refetching 포함)
  - `status` 데이터에 관한 정보. 가지고 있는가 아닌가. (pending, error, success)
  - `fetchStatus` 쿼리 함수에 관한 정보. 돌아가는 중인가 아닌가. (fetching, paused, idle)
  - `isFetching` vs. `isLoading`
    - `isFetching`
      - 캐시가 쿼리를 fetching하는 중
      - 전역 수준에서 사용
      - 현재 데이터를 가져오는 쿼리가 있는지 확인할 때 사용
      - 데이터를 가져올 때 로딩 스피너 또는 진행률 표시줄을 표시하거나 모든 데이터 가져오기가 완료될 때까지 특정 UI 요소를 비활성화하는 것과 같은 시나리오에 유용
    - `isLoading`
      - isFetching true & 캐시된 데이터가 없는 경우
      - 쿼리 수준에서 사용
      - 데이터를 가져오는 동안 로딩 메시지를 조건부로 렌더링할 때 사용
      - 특정 데이터를 가져오기를 기다리는 동안 로드 메시지 또는 콘텐츠를 표시하거나 특정 쿼리의 로드 상태에 따라 구성 요소를 조건부로 렌더링할 수 있음
      - `enabled` 지정된 조건이 참인 경우에만 요청 수행
  - `isInitialLoading`
    - 캐시에 저장된 데이터가 없거나 cacheTime이 지난 후 재요청이 일어날 때
  - `initialData`, `placeholderData`
    - 초기 값을 캐시에 추가하고 싶을 때
- 변이 (useMutation)
  - mutate 함수 리턴
  - 쿼리 키 필요 없음 & isLoading은 있지만 isFetching은 없음 (캐시와 상관없으므로)
  - 기본적으로 no retries
  ```jsx
  const queryClient = useQueryClient();

  function CabinRow(cabin) {
  	const { isLoading, mutate } = useMutation({
      mutationFn: (id) => deleteCabin(id),
      onSuccess: () => {
        queryClient.**invalidateQueries**({
          **queryKey: ["cabins"],**
        });
      },
      onError: (err) => alert(err.message),
    });

    return (
      <TableRow role="row">
        <button onClick={() => mutate(cabinId)} disabled={isLoading}>
          Delete
        </button>
      </TableRow>
    );
  }
  ```
  - 데이터 변이 성공시 캐쉬를 **invalidate** 함으로써 리스트를 다시 읽도록(**refetch**) 하고, UI를 바로 업데이트 할 수 있음
  - prefix 설정을 통해 관련 쿼리를 한번에 invalidate 가능
  - Optimistic Updates
    - 서버 리스폰스 전에 캐시 업데이트
    - you’re ‘optimistic’ that the mutation will work
      - 캐시 더 빠르게 업데이트 가능. 특히 많은 컴포넌트가 그 캐시와 관련있을 때.
    - If 서버 fails? Manually Canceling Query
      - 롤백, 쿼리 취소 (`onMutate` cb → `onError` handler)
      - RQ uses AbortController to cancel
        - axios query: pass `signal` to axios via argument to query fn
        ![Untitled](<%E1%84%85%E1%85%B5%E1%84%8B%E1%85%A2%E1%86%A8%E1%84%90%E1%85%B3%20%E1%84%8F%E1%85%AF%E1%84%85%E1%85%B5%20(@tanstack%20react-query)%206ea4efe5054649c1a6fc077ac701efd8/Untitled.png>)
      -
- 프리 페칭(useQueryClient.prefetchQuery)
  - Options for pe-populating data//H
    ![Untitled](<%E1%84%85%E1%85%B5%E1%84%8B%E1%85%A2%E1%86%A8%E1%84%90%E1%85%B3%20%E1%84%8F%E1%85%AF%E1%84%85%E1%85%B5%20(@tanstack%20react-query)%206ea4efe5054649c1a6fc077ac701efd8/Untitled%201.png>)
    ![Untitled](<%E1%84%85%E1%85%B5%E1%84%8B%E1%85%A2%E1%86%A8%E1%84%90%E1%85%B3%20%E1%84%8F%E1%85%AF%E1%84%85%E1%85%B5%20(@tanstack%20react-query)%206ea4efe5054649c1a6fc077ac701efd8/Untitled%202.png>)
  - 홈에서 미리 데이터 가져오기
    ```jsx
    // 데이터 가져오는 커스텀 훅

    import { useQuery, useQueryClient } from 'react-query';
    import { queryKeys } from '../../../react-query/constants';

    async function getTreatments(): Promise<Treatment[]> {...}
    export function useTreatments(): Treatment[] {...}

    // populate cache
    **export function usePrefetchTreatments(): void {
      const queryClient = useQueryClient();
      queryClient.prefetchQuery(queryKeys.treatments, getTreatments);
    }**
    ```
    ```jsx
    // Home.tsx

    import { usePrefetchTreatments } from 'components/treatments/hooks/useTreatments';

    export function Home(): ReactElement {
    // Home은 자주 rerender 되지 않기 때문에 여기서 data를 미리 fetch
      **usePrefetchTreatments();**

      return (...);
    }
    ```
  - 다음 달 캘린더 데이터 가져오기 (useEffect, prefetchQuery)
    ```tsx
    // 데이터 fetch용 use 커스텀 훅

    import { Dispatch, SetStateAction, useEffect, useState } from 'react';
    import { useQuery, useQueryClient } from 'react-query';

    async function getAppointments()

    // types for hook return object
    interface UseAppointments {
      appointments: AppointmentDateMap;
      monthYear: MonthYear;
      updateMonthYear: (monthIncrement: number) => void;
      showAll: boolean;
      setShowAll: Dispatch<SetStateAction<boolean>>;
    }

    export function useAppointments(): UseAppointments {
      const currentMonthYear = getMonthYearDetails(dayjs());
      const [monthYear, setMonthYear] = useState(currentMonthYear);
      function updateMonthYear(monthIncrement: number): void {
        setMonthYear((prevData) => getNewMonthYear(prevData, monthIncrement));
      }
      const [showAll, setShowAll] = useState(false);
      const { user } = useUser();

      **const queryClient = useQueryClient();
      useEffect(() => {
        const nextMonthYear = getNewMonthYear(monthYear, 1);

        queryClient.prefetchQuery(
          [queryKeys.appointments, nextMonthYear.year, nextMonthYear.month],
          () => getAppointments(nextMonthYear.year, nextMonthYear.month),
        );
      }, [queryClient, monthYear]);**

      const fallback = {};
      **const { data: appointments = fallback } = useQuery(
        [queryKeys.appointments, monthYear.year, monthYear.month],
        () => getAppointments(monthYear.year, monthYear.month),
      );**

      return { appointments, monthYear, updateMonthYear, showAll, setShowAll };
    }
    ```
  - 다음 페이지 미리 가져오기 (keepPreviousData)
    ```jsx
    // pagination, prefetching next page
    import { useQuery, useQueryClient } from "@tanstack/react-query";

    const queryClient = useQueryClient();

    useEffect(() => {
        if (currentPage < maxPostPage) {
          const nextPage = currentPage + 1;
          **queryClient.prefetchQuery({
            queryKey: ["posts", nextPage],
            queryFn: () => fetchPosts(nextPage),
          });**
        }
      }, [currentPage, queryClient]);

    // 이전 데이터도 캐시에 keep할 수 있음
    // 기다리는 동안 이전 데이터가 보여도 되는 상황에만 유효
    const { data, isError, error, isLoading } = useQuery({
        queryKey: ["posts", currentPage],
        queryFn: () => fetchPosts(currentPage),
        **keepPreviousData: true,**
    });
    ```
  ```jsx
  // useBookings.js
  const pageCount = Math.ceil(count / PAGE_SIZE);

  if (page < pageCount) {
    queryClient.prefetchQuery({
      queryKey: ["bookings", filter, sortBy, page + 1],
      queryFn: () => getBookings({ filter, sortBy, page: page + 1 }),
    });
  }

  if (page > 1) {
    queryClient.prefetchQuery({
      queryKey: ["bookings", filter, sortBy, page - 1],
      queryFn: () => getBookings({ filter, sortBy, page: page - 1 }),
    });
  }
  ```
  - `Prefetch`
    - 캐시에 데이터 더함
    - 자동으로 stale (configurable)
    - shows while re-fetching (캐시가 만료되지 않는 이상, 캐시 만료되면 로딩 표시기가 뜸)
    - can be used for any anticipated data needs
  - 캐시에 없는 쿼리는 로딩하면서 데이터를 얻어 오는데 UX를 떨어뜨림 → 이전/다음 페이지에 대해서는 프리페칭해서 로딩되지 않고도 미리 데이터를 캐싱함
- 무한 쿼리(useInfiniteQuery)
  - 아래 예제에서는 react-infinite-scroller 라이브러리와 함께 사용됨
  ```jsx
  import { useInfiniteQuery } from "@tanstack/react-query";
  import InfiniteScroll from "react-infinite-scroller";
  import { Person } from "./Person";

  const initialUrl = "https://swapi.dev/api/people/";
  const fetchUrl = async (url) => {
    const response = await fetch(url);
    return response.json();
  };

  export function InfinitePeople() {
    const { data, fetchNextPage, hasNextPage, isLoading, isFetching, isError } =
      useInfiniteQuery({
        queryKey: ["sw-people"],
        queryFn: ({ pageParam = initialUrl }) => fetchUrl(pageParam),
        getNextPageParam: (lastPage) => lastPage.next || undefined,
      });

    if (isLoading) return <div className="loading">Loading...</div>;
    if (isError) return <div>Error! {error.toString()}</div>;

    return (
      <>
        {isFetching && <div className="loading">Fetching...</div>}
        <InfiniteScroll loadMore={fetchNextPage} hasMore={hasNextPage}>
          {data.pages.map((pageData) => {
            return pageData.results.map((person) => {
              return (
                <Person
                  key={person.name}
                  id={person.name}
                  name={person.name}
                  hairColor={person.hair_color}
                  eyeColor={person.eye_color}
                />
              );
            });
          })}
        </InfiniteScroll>
      </>
    );
  }
  ```
- 로딩 컴포넌트 중앙화 (useIsFetching) + 전역 에러 핸들링 (onError cb)
  - an optional hook that returns the **`number`** of the queries that your application is loading or fetching in the background (useful for app-wide loading indicators).
  - 더 작은 앱에서는
    - useQuery에서 isFetching 사용 (isLoading = isFetching + no cached data)
  - 더 큰 앱에서는
    - 모든 커스텀 훅에 isFetching을 고려할 필요가 없이
    - 어떤 query가 isFetching이든 Load로딩 스피너 적용해야 함
  ```jsx
  // Loading 컴포넌트

  import { ReactElement } from 'react';
  import { useIsFetching } from 'react-query';

  export function Loading(): ReactElement {
    **const isFetching = useIsFetching();**
    const display = isFetching ? 'inherit' : 'none';

    return (
      <Spinner display={display}>
        <Text display="none">Loading...</Text>
      </Spinner>
    );
  }
  ```
  ```jsx
  // App.tsx

  import { QueryClient } from 'react-query';
  import { createStandaloneToast } from '@chakra-ui/react';
  import { theme } from '../theme';

  const toast = createStandaloneToast({ theme });

  function queryErrorHandler(error: unknown): void {
    // error is type unknown because in js, anything can be an error (e.g. throw(5))
    const title =
      error instanceof Error ? error.message : 'error connecting to server';

    // prevent duplicate toasts
    toast.closeAll();
    toast({ title, status: 'error', variant: 'subtle', isClosable: true });
  }

  export const queryClient = new QueryClient({
    defaultOptions: {
      **queries: {
        onError: queryErrorHandler,
      },**
    },
  });
  ```
  - 대체안으로, 리액트의 에러 바운더리 사용하기 (useErrorBoundary)
    - Set to true to propagate errors to the nearest error boundary
- 필터 (select option)
  - 이미 가져온 데이터를 필터하는 옵션
  - 필요한 이유
    - RQ가 불필요한 계산을 방지하기 위해 메모이제이션 해줌
    - 데이터가 바뀌거나 함수가 바뀔 때만 run
  - select function은 stable하기 때문에 useCallback으로 감싸주는 게 좋다
  ```tsx
  import { useEffect, useState, **useCallback** } from 'react';

  interface UseAppointments {
    appointments: AppointmentDateMap;
    monthYear: MonthYear;
    updateMonthYear: (monthIncrement: number) => void;
    **showAll**: boolean;
    setShowAll: Dispatch<SetStateAction<boolean>>;
  }

  export function useAppointments(): UseAppointments {
  	...
  	const { user } = useUser();
    **const selectFn = useCallback((data) => getAvailableAppointments(data, user), [
      user,
    ]);**

  	const fallback = {};
    const { data: appointments = fallback } = useQuery(
      [queryKeys.appointments, monthYear.year, monthYear.month],
      () => getAppointments(monthYear.year, monthYear.month),
      **{
        select: showAll ? undefined : selectFn,
      },**
    );

  	return { appointments, monthYear, updateMonthYear, showAll, setShowAll };
  }
  ```
- 리페칭 (refetch)
  - `refetchOnMount`, `refetchOnwindowFocus`, `refetchOnReconnect`, `refetchInterval` / `refetch` function in useQuery
  - stale 데이터가 서버에서 업데이트 됐는지 확인
  - stale 쿼리는 백그라운드에서 자동으로 리페칭 됨
    - 새로운 쿼리 인스턴스가 마운트될 때
    - useQuery를 콜하는 리액트 컴포넌트가 마운트될 때
    - 윈도우가 다시 포커스 됐을 때
    - 네트워크가 다시 연결 됐을 때
    - `refetchInterval`이 만료됐을 때
  - 리페칭 방지
    - stale 타임 늘리기
    - `refetchOnMount`, `refetchOnwindowFocus`, `refetchOnReconnect` off
    - 별로 안 바뀌는 데이터, outdated 돼도 상관없는 데이터에만 사용하기
    - Ask: is it worth it? (saving n/w costs)
  -
- 쿼리 클라이언트의 쿼리 데이터 세팅 (setQueryData, removeQuery)
  - 어떤 쿼리의 캐시 데이터를 즉각적으로 업데이트하기 위해 사용되는 동기 함수
