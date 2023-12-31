import { ChakraProvider } from '@chakra-ui/react';
import { ReactElement } from 'react';
import { QueryClientProvider } from 'react-query';
import { queryClient } from '../../react-query/queryClient';
import { ReactQueryDevtools } from 'react-query/devtools';
import { theme } from '../../theme';
import { Loading } from './Loading';
import { Navbar } from './Navbar';
import { Routes } from './Routes';

export function App(): ReactElement {
  return (
    <ChakraProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools />
        <Navbar />
        <Loading />
        <Routes />
      </QueryClientProvider>
    </ChakraProvider>
  );
}
