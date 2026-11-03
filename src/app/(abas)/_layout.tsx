import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components';
import { useReduceMotion } from '@/lib/motion';
import { tabDissolve } from '@/lib/transitions';
import { colors } from '@/theme';

export default function TabsLayout() {
  const reduceMotion = useReduceMotion();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.paper },
        ...tabDissolve(reduceMotion),
      }}
    >
      <Tabs.Screen name="explorar" options={{ title: 'Explorar' }} />
      <Tabs.Screen name="buscar" options={{ title: 'Buscar' }} />
      <Tabs.Screen name="salvos" options={{ title: 'Salvos' }} />
    </Tabs>
  );
}
