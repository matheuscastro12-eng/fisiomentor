import { View, Text, SafeAreaView, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

const PLACEHOLDER_REPORTS = [
  {
    id: '1',
    studentName: 'João Silva',
    type: 'Desempenho',
    date: '15/03/2026',
    icon: 'trending-up',
  },
  {
    id: '2',
    studentName: 'Maria Santos',
    type: 'Progresso',
    date: '14/03/2026',
    icon: 'bar-chart-2',
  },
  {
    id: '3',
    studentName: 'Pedro Costa',
    type: 'Avaliação',
    date: '12/03/2026',
    icon: 'clipboard',
  },
];

export default function RelatoriosScreen() {
  const renderReportCard = ({ item }: { item: typeof PLACEHOLDER_REPORTS[0] }) => (
    <TouchableOpacity className="bg-surface-container rounded-lg p-lg mb-md border border-surface-container-high">
      <View className="flex-row items-start gap-lg">
        <View className="bg-primary/20 rounded-lg w-12 h-12 justify-center items-center">
          <Feather
            name={item.icon as any}
            size={20}
            color="#42dec3"
          />
        </View>
        <View className="flex-1">
          <Text className="text-on-surface font-bold mb-xs">
            {item.studentName}
          </Text>
          <Text className="text-on-surface-variant text-xs mb-md">
            {item.type} • {item.date}
          </Text>
          <TouchableOpacity className="flex-row items-center">
            <Text className="text-primary font-semibold text-sm">
              Ver Relatório
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color="#42dec3"
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 px-lg py-md">
        {/* Header */}
        <View className="mb-2xl">
          <Text className="text-2xl font-bold text-on-surface">
            Relatórios
          </Text>
          <Text className="text-on-surface-variant text-sm mt-xs">
            Histórico de desempenho dos alunos
          </Text>
        </View>

        {/* Stats Overview */}
        <View className="flex-row gap-md mb-xl">
          <View className="flex-1 bg-surface-container rounded-lg p-md border border-surface-container-high">
            <Text className="text-on-surface-variant text-xs mb-xs">
              Total de Relatórios
            </Text>
            <Text className="text-on-surface font-bold text-xl">
              {PLACEHOLDER_REPORTS.length}
            </Text>
          </View>
          <View className="flex-1 bg-surface-container rounded-lg p-md border border-surface-container-high">
            <Text className="text-on-surface-variant text-xs mb-xs">
              Este Mês
            </Text>
            <Text className="text-on-surface font-bold text-xl">
              12
            </Text>
          </View>
        </View>

        {/* Reports List */}
        <FlatList
          data={PLACEHOLDER_REPORTS}
          keyExtractor={(item) => item.id}
          renderItem={renderReportCard}
          scrollEnabled={false}
          ListEmptyComponent={
            <View className="items-center py-2xl">
              <Ionicons
                name="document-outline"
                size={48}
                color="#8b9db3"
              />
              <Text className="text-on-surface-variant text-sm mt-lg">
                Nenhum relatório disponível
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
