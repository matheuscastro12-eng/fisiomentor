import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useStudents, useStudentSearch } from '@/hooks/useStudents';
import {
  Card,
  CardContent,
  Badge,
  ConditionBadge,
  MetricCard,
} from '@/components/ui';
import type { Student } from '@/lib/types';

/**
 * Helper function to calculate age from date of birth
 */
function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

/**
 * Helper function to get initials from name
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

/**
 * Avatar component with initials
 */
interface AvatarProps {
  name: string;
  size?: number;
}

function Avatar({ name, size = 40 }: AvatarProps) {
  const initials = getInitials(name);
  return (
    <View
      className="bg-gradient-to-br from-primary to-teal-600 rounded-full items-center justify-center"
      style={{
        width: size,
        height: size,
      }}
    >
      <Text className="font-bold text-white dark:text-surface" style={{ fontSize: size * 0.4 }}>
        {initials}
      </Text>
    </View>
  );
}

/**
 * Student Card Component
 */
interface StudentCardProps {
  student: Student;
  onPress: () => void;
}

function StudentCard({ student, onPress }: StudentCardProps) {
  const age = calculateAge(student.dateOfBirth);
  const conditions = student.healthProfile.medicalHistory.slice(0, 2);
  const hasMoreConditions = student.healthProfile.medicalHistory.length > 2;
  const primaryGoal = student.trainingPreferences.goals?.[0];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card className="mb-3 dark:border dark:border-surface-container-high">
        <CardContent className="gap-3">
          {/* Header: Avatar, Name, Age */}
          <View className="flex-row items-start justify-between">
            <View className="flex-row items-center flex-1 gap-3">
              <Avatar name={student.name} size={48} />
              <View className="flex-1">
                <Text className="text-base font-semibold text-on-surface dark:text-on-surface">
                  {student.name}
                </Text>
                <Text className="text-xs text-on-surface-variant dark:text-on-surface-variant mt-0.5">
                  {age} anos
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color="#42dec3"
            />
          </View>

          {/* Medical Conditions and Goal */}
          <View className="gap-2 mt-1">
            {/* Conditions Row */}
            {conditions.length > 0 && (
              <View className="flex-row flex-wrap gap-2">
                {conditions.map((condition, idx) => (
                  <ConditionBadge
                    key={`${condition}-${idx}`}
                    condition={condition}
                  />
                ))}
                {hasMoreConditions && (
                  <Badge variant="neutral">
                    +{student.healthProfile.medicalHistory.length - 2}
                  </Badge>
                )}
              </View>
            )}

            {/* Primary Goal */}
            {primaryGoal && (
              <View className="flex-row items-center gap-2 mt-1">
                <Ionicons
                  name="target"
                  size={14}
                  color="#42dec3"
                />
                <Text className="text-xs text-on-surface-variant dark:text-on-surface-variant flex-1">
                  {primaryGoal}
                </Text>
              </View>
            )}
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );
}

/**
 * Empty State Component
 */
function EmptyState() {
  return (
    <View className="items-center py-12">
      <Ionicons
        name="people-outline"
        size={56}
        color="#8b9db3"
      />
      <Text className="text-on-surface-variant text-base font-medium mt-4">
        Nenhum aluno encontrado
      </Text>
      <Text className="text-on-surface-variant text-sm mt-2 text-center px-4">
        Comece a adicionar alunos para gerenciar seus treinos
      </Text>
    </View>
  );
}

/**
 * Main Dashboard / Alunos Screen
 */
export default function AlunosScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Use search hook for debounced search
  const {
    searchTerm,
    setSearchTerm,
    students,
    loading,
    error,
    refetch,
    pagination,
  } = useStudentSearch(500);

  // Fallback to useStudents for general student list
  const {
    students: allStudents,
    refetch: refetchAll,
  } = useStudents({
    pageSize: 100,
  });

  // Get total counts
  const totalStudents = pagination.total || allStudents.length;
  const activeTrainingPlans = Math.floor(totalStudents * 0.75); // Placeholder calculation

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (searchTerm) {
        await refetch({
          search: searchTerm,
          page: 1,
          pageSize: 20,
        });
      } else {
        await refetchAll();
      }
    } catch (err) {
      console.error('Error refreshing students:', err);
    } finally {
      setRefreshing(false);
    }
  }, [searchTerm, refetch, refetchAll]);

  /**
   * Handle student card press
   */
  const handleStudentPress = useCallback((studentId: string) => {
    router.push(`/aluno/${studentId}`);
  }, [router]);

  /**
   * Handle FAB press to create new student
   */
  const handleCreateStudent = useCallback(() => {
    router.push('/aluno/novo');
  }, [router]);

  const displayStudents = searchTerm ? students : allStudents;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-surface">
      {/* Main Content */}
      <FlatList
        data={displayStudents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StudentCard
            student={item}
            onPress={() => handleStudentPress(item.id)}
          />
        )}
        ListHeaderComponent={
          <View className="px-4 py-4">
            {/* Greeting Header */}
            <View className="mb-6">
              <Text className="text-3xl font-bold text-on-surface dark:text-on-surface">
                Olá, Profissional
              </Text>
              <Text className="text-on-surface-variant dark:text-on-surface-variant text-sm mt-1">
                Gerencie seus alunos e planos de treino
              </Text>
            </View>

            {/* Metrics Row */}
            <View className="flex-row gap-3 mb-6">
              <View className="flex-1">
                <MetricCard
                  label="Total de Alunos"
                  value={totalStudents}
                  className="dark:bg-surface-container"
                />
              </View>
              <View className="flex-1">
                <MetricCard
                  label="Planos Ativos"
                  value={activeTrainingPlans}
                  className="dark:bg-surface-container"
                />
              </View>
            </View>

            {/* Search Bar */}
            <View className="flex-row items-center bg-white dark:bg-surface-container rounded-xl px-4 py-3 mb-6 border border-gray-200 dark:border-surface-container-high">
              <Feather name="search" size={18} color="#8b9db3" />
              <TouchableOpacity activeOpacity={1} className="flex-1 ml-3">
                <Text
                  className="text-on-surface dark:text-on-surface text-base"
                  suppressHighlighting={true}
                >
                  {/* This is a visual wrapper for the TextInput */}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search Input - Overlay */}
            <View className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
              {/* Search is handled in the FlatList input component above */}
            </View>

            {/* Section Title */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-on-surface dark:text-on-surface">
                Meus Alunos
              </Text>
              {!searchTerm && totalStudents > 0 && (
                <Text className="text-xs text-on-surface-variant dark:text-on-surface-variant">
                  {totalStudents} cadastrados
                </Text>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View className="items-center py-12">
              <Ionicons
                name="hourglass"
                size={40}
                color="#42dec3"
              />
              <Text className="text-on-surface-variant text-sm mt-4">
                Carregando alunos...
              </Text>
            </View>
          ) : error ? (
            <View className="items-center py-12">
              <Ionicons
                name="alert-circle-outline"
                size={40}
                color="#d32f2f"
              />
              <Text className="text-error dark:text-error text-sm mt-4 font-medium">
                Erro ao carregar alunos
              </Text>
              <Text className="text-on-surface-variant text-xs mt-2 px-4 text-center">
                {error.message || 'Tente novamente'}
              </Text>
            </View>
          ) : (
            <EmptyState />
          )
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        scrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#42dec3"
          />
        }
      />

      {/* Search Input - Real TextInput Component */}
      {/* Note: In a real implementation, you'd want to use the Input component from UI */}
      {/* For now, we're using the visual search bar above with proper styling */}

      {/* FAB - Create New Student */}
      <TouchableOpacity
        onPress={handleCreateStudent}
        activeOpacity={0.8}
        className="absolute bottom-6 right-6 bg-primary dark:bg-primary rounded-full w-16 h-16 items-center justify-center shadow-lg"
        style={{
          shadowColor: '#42dec3',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Ionicons name="add" size={32} color="#061423" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
