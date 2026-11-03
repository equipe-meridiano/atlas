// AsyncStorage é um módulo nativo; nos testes usamos a versão em memória oferecida pela própria biblioteca.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
