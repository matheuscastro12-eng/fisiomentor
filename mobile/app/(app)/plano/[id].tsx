import React, { useEffect, useState } from 'react';
import {
  View,
  SectionList,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Text,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { getTrainingPlan } from '@/lib/api';
import {
  TrainingPlan,
  TrainingPhase,
  TrainingWeek,
  TrainingSession,
  Exercise,
} from '@/lib/types';
import { Card, CardContent, Badge, Button } from '@/components/ui';

const DAYS_OF_WEEK = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
];

type ExerciseSection = {
  title: string;
  data: Array<{ exercise: Exercise; sessionId: string; phaseIndex: number; weekIndex: number }>;
  sessionData: {
    name: string;
    dayOfWeek: number;
    duration: number;
    type: string;
  };
};

export default function TrainingPlanDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  useEffect(() => {
    loadPlan();
  }, [id]);

  const loadPlan = async () => {
    if (!id) {
      setError('ID do plano não fornecido');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getTrainingPlan(id);
      setPlan(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao carregar o plano de treino'
      );
    } finally {
      setLoading(false);
    }
  };

  const buildSectionListData = (plan: TrainingPlan): ExerciseSection[] => {
    const sections: ExerciseSection[] = [];

    plan.phases.forEach((phase, phaseIndex) => {
      phase.weeks.forEach((week, weekIndex) => {
        week.sessions.forEach((session) => {
          const exerciseItems = session.exercises.map((exercise) => ({
            exercise,
            sessionId: session.id,
            phaseIndex,
            weekIndex,
          }));

          sections.push({
            title: `${session.name} - ${DAYS_OF_WEEK[session.dayOfWeek]}`,
            data: exerciseItems,
            sessionData: {
              name: session.name,
              dayOfWeek: session.dayOfWeek,
              duration: session.duration,
              type: session.type,
            },
          });
        });
      });
    });

    return sections;
  };

  const getIntensityColor = (intensity: string): string => {
    const lower = intensity.toLowerCase();
    if (lower.includes('light') || lower.includes('leve')) {
      return 'bg-green-600 dark:bg-green-700';
    }
    if (lower.includes('moderate') || lower.includes('moderado')) {
      return 'bg-yellow-600 dark:bg-yellow-700';
    }
    if (lower.includes('high') || lower.includes('alto') || lower.includes('intenso')) {
      return 'bg-red-600 dark:bg-red-700';
    }
    return 'bg-blue-600 dark:bg-blue-700';
  };

  const getIntensityLabel = (intensity: string): string => {
    const lower = intensity.toLowerCase();
    if (lower.includes('light') || lower.includes('leve')) return 'Leve';
    if (lower.includes('moderate') || lower.includes('moderado')) return 'Moderado';
    if (lower.includes('high') || lower.includes('alto') || lower.includes('intenso'))
      return 'Intenso';
    return intensity;
  };

  const handleSharePlan = async () => {
    if (!plan) return;

    try {
      await Share.share({
        message: `Plano de Treino: ${plan.title}\n\nDescrição: ${plan.description || 'Sem descrição'}\n\nDuração: ${plan.duration} ${plan.durationUnit}`,
        title: plan.title,
      });
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível compartilhar o plano');
    }
  };

  const handleExportPlan = async () => {
    if (!plan) return;
    Alert.alert('Exportar', 'Funcionalidade de exportação em desenvolvimento');
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
        <StatusBar barStyle="dark-content" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text className="mt-4 text-slate-600 dark:text-slate-300">
            Carregando plano...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !plan) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
        <StatusBar barStyle="dark-content" />
        <View className="flex-1 px-4 justify-center items-center">
          <Ionicons
            name="alert-circle"
            size={48}
            color="#ef4444"
            style={{ marginBottom: 16 }}
          />
          <Text className="text-lg font-semibold text-slate-900 dark:text-white text-center mb-2">
            Erro ao carregar plano
          </Text>
          <Text className="text-slate-600 dark:text-slate-400 text-center mb-6">
            {error || 'Plano não encontrado'}
          </Text>
          <Button onPress={loadPlan} className="bg-blue-600">
            <Text className="text-white font-semibold">Tentar Novamente</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const sections = buildSectionListData(plan);

  const renderHeader = () => (
    <View className="px-4 py-4 gap-4 bg-white dark:bg-slate-950">
      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center gap-2 py-2 px-1"
        >
          <Feather name="arrow-left" size={24} color="#0ea5e9" />
        </TouchableOpacity>
        <View className="flex-1 ml-3">
          <Text className="text-xl font-bold text-slate-900 dark:text-white">
            {plan.title}
          </Text>
        </View>
        <Badge
          className={`${plan.isActive ? 'bg-green-600' : 'bg-slate-400'} dark:${plan.isActive ? 'bg-green-700' : 'bg-slate-600'}`}
        >
          <Text className="text-white text-xs font-semibold">
            {plan.isActive ? 'Ativo' : 'Inativo'}
          </Text>
        </Badge>
      </View>

      {/* Plan Summary Card */}
      <Card className="border border-slate-200 dark:border-slate-700">
        <CardContent className="gap-4">
          {plan.description && (
            <View>
              <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Descrição
              </Text>
              <Text className="text-sm text-slate-600 dark:text-slate-400">
                {plan.description}
              </Text>
            </View>
          )}

          {/* Duration */}
          <View className="flex-row items-center gap-2">
            <Feather name="clock" size={16} color="#64748b" />
            <Text className="text-sm text-slate-600 dark:text-slate-400">
              Duração: <Text className="font-semibold">{plan.duration} {plan.durationUnit}</Text>
            </Text>
          </View>

          {/* Date Range */}
          {plan.startDate && plan.endDate && (
            <View className="flex-row items-center gap-2">
              <Feather name="calendar" size={16} color="#64748b" />
              <Text className="text-sm text-slate-600 dark:text-slate-400">
                {new Date(plan.startDate).toLocaleDateString('pt-BR')} até{' '}
                {new Date(plan.endDate).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          )}

          {/* Objectives */}
          {plan.objectives && plan.objectives.length > 0 && (
            <View>
              <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Objetivos
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {plan.objectives.map((objective, index) => (
                  <Badge key={index} className="bg-teal-600 dark:bg-teal-700">
                    <Text className="text-white text-xs">{objective}</Text>
                  </Badge>
                ))}
              </View>
            </View>
          )}

          {/* Clinical Notes */}
          {plan.notes && (
            <View className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
              <View className="flex-row gap-2">
                <Feather name="alert-triangle" size={16} color="#b45309" />
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-amber-900 dark:text-amber-100 mb-1">
                    Observações Clínicas
                  </Text>
                  <Text className="text-xs text-amber-800 dark:text-amber-200">
                    {plan.notes}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <View className="flex-row gap-2">
        <Button
          onPress={handleSharePlan}
          className="flex-1 bg-blue-600 dark:bg-blue-700 flex-row items-center justify-center gap-2"
        >
          <Feather name="share-2" size={16} color="white" />
          <Text className="text-white font-semibold">Compartilhar</Text>
        </Button>
        <Button
          onPress={handleExportPlan}
          className="flex-1 bg-slate-600 dark:bg-slate-700 flex-row items-center justify-center gap-2"
        >
          <Feather name="download" size={16} color="white" />
          <Text className="text-white font-semibold">Exportar</Text>
        </Button>
      </View>

      {/* Sessions Header */}
      <View className="pt-2">
        <Text className="text-lg font-bold text-slate-900 dark:text-white">
          Sessões de Treino
        </Text>
      </View>
    </View>
  );

  const renderSectionHeader = ({ section }: { section: ExerciseSection }) => (
    <View className="bg-slate-100 dark:bg-slate-800 px-4 py-3 border-t border-slate-200 dark:border-slate-700">
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-1">
          <Text className="text-base font-semibold text-slate-900 dark:text-white">
            {section.title}
          </Text>
          <View className="flex-row items-center gap-2 mt-2">
            <View className="flex-row items-center gap-1">
              <Feather name="clock" size={12} color="#64748b" />
              <Text className="text-xs text-slate-600 dark:text-slate-400">
                {section.sessionData.duration} min
              </Text>
            </View>
            <Badge className="bg-slate-300 dark:bg-slate-600">
              <Text className="text-xs text-slate-700 dark:text-slate-200">
                {section.sessionData.type}
              </Text>
            </Badge>
          </View>
        </View>
      </View>
    </View>
  );

  const renderExerciseItem = ({ item }: { item: (typeof sections[0]['data'][0]) }) => {
    const { exercise } = item;
    const isExpanded = expandedExercise === exercise.id;

    return (
      <TouchableOpacity
        onPress={() =>
          setExpandedExercise(isExpanded ? null : exercise.id)
        }
        className="border-b border-slate-200 dark:border-slate-700"
      >
        <View className="px-4 py-3 bg-white dark:bg-slate-900">
          {/* Main Exercise Row */}
          <View className="flex-row items-start justify-between gap-2">
            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-2">
                <Text className="flex-1 text-base font-semibold text-slate-900 dark:text-white">
                  {exercise.name}
                </Text>
                <Feather
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#64748b"
                />
              </View>

              {/* Sets, Reps, Rest */}
              <View className="flex-row flex-wrap items-center gap-3">
                {exercise.sets && exercise.reps && (
                  <View className="flex-row items-center gap-1">
                    <Feather name="layers" size={14} color="#64748b" />
                    <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {exercise.sets}x{exercise.reps}
                    </Text>
                  </View>
                )}

                {exercise.duration && (
                  <View className="flex-row items-center gap-1">
                    <Feather name="timer" size={14} color="#64748b" />
                    <Text className="text-sm text-slate-600 dark:text-slate-400">
                      {exercise.duration}s
                    </Text>
                  </View>
                )}

                {exercise.rest && (
                  <View className="flex-row items-center gap-1">
                    <Feather name="pause-circle" size={14} color="#64748b" />
                    <Text className="text-sm text-slate-600 dark:text-slate-400">
                      {exercise.rest}s
                    </Text>
                  </View>
                )}

                <Badge className={getIntensityColor(exercise.intensity)}>
                  <Text className="text-white text-xs font-semibold">
                    {getIntensityLabel(exercise.intensity)}
                  </Text>
                </Badge>
              </View>
            </View>
          </View>

          {/* Expanded Details */}
          {isExpanded && (
            <View className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 gap-3">
              {/* Form Instructions */}
              {exercise.form && (
                <View className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                  <View className="flex-row gap-2">
                    <Feather name="info" size={16} color="#0369a1" />
                    <View className="flex-1">
                      <Text className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                        Forma de Execução
                      </Text>
                      <Text className="text-xs text-blue-800 dark:text-blue-200">
                        {exercise.form}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Equipment */}
              {exercise.equipment && exercise.equipment.length > 0 && (
                <View>
                  <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Equipamentos
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {exercise.equipment.map((item, idx) => (
                      <Badge key={idx} className="bg-slate-300 dark:bg-slate-600">
                        <Text className="text-slate-700 dark:text-slate-200 text-xs">
                          {item}
                        </Text>
                      </Badge>
                    ))}
                  </View>
                </View>
              )}

              {/* Modifications */}
              {exercise.modifications && exercise.modifications.length > 0 && (
                <View>
                  <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Modificações
                  </Text>
                  {exercise.modifications.map((mod, idx) => (
                    <View key={idx} className="flex-row gap-2 mb-2">
                      <Text className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        •
                      </Text>
                      <Text className="flex-1 text-xs text-slate-600 dark:text-slate-400">
                        {mod}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Notes */}
              {exercise.notes && (
                <View className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                  <View className="flex-row gap-2">
                    <Feather name="sticky-note" size={16} color="#b45309" />
                    <View className="flex-1">
                      <Text className="text-xs font-semibold text-amber-900 dark:text-amber-100 mb-1">
                        Anotações
                      </Text>
                      <Text className="text-xs text-amber-800 dark:text-amber-200">
                        {exercise.notes}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <StatusBar barStyle="dark-content" />
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item.exercise.id}-${index}`}
        renderItem={renderExerciseItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: 24 }}
        scrollEnabled={true}
      />
    </SafeAreaView>
  );
}
