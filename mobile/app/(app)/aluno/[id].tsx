import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';

import { getStudent, getStudentProgress, getStudentAssessments, apiFetch } from '@/lib/api';
import { Student, TrainingPlan, ProgressRecord, Assessment } from '@/lib/types';
import { Card, CardContent, Badge, ConditionBadge, Button, MetricCard } from '@/components/ui';

export default function StudentProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [activeTab, setActiveTab] = useState<'dados' | 'planos' | 'progresso'>('dados');
  const [student, setStudent] = useState<Student | null>(null);
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchStudentData();
    }
  }, [id]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError(null);

      const studentData = await getStudent(id!);
      setStudent(studentData);

      const progressData = await getStudentProgress(id!);
      setProgressRecords(progressData);

      const assessmentsData = await getStudentAssessments(id!);
      setAssessments(assessmentsData.data || []);

      // Fetch training plans
      const plansData = await apiFetch<{ data: TrainingPlan[] }>(
        `/students/${id}/plans`
      );
      setTrainingPlans(plansData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados do aluno');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !student) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-950 px-4">
        <View className="flex-1 justify-center items-center">
          <Text className="text-red-600 dark:text-red-400 text-center mb-4">
            {error || 'Aluno não encontrado'}
          </Text>
          <Button
            title="Tentar novamente"
            onPress={fetchStudentData}
            variant="primary"
          />
        </View>
      </SafeAreaView>
    );
  }

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Calculate BMI
  const calculateBMI = (height: number, weight: number) => {
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const age = calculateAge(student.dateOfBirth);
  const bmi = calculateBMI(
    student.healthProfile.height,
    student.healthProfile.weight
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-4 pb-6 border-b border-gray-200 dark:border-gray-800">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4"
            >
              <Feather name="arrow-left" size={24} color="#0ea5e9" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                {student.name}
              </Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                {age} anos
              </Text>
            </View>
            <View className="w-12 h-12 rounded-full bg-cyan-500 justify-center items-center">
              <Text className="text-white font-bold text-lg">
                {getInitials(student.name)}
              </Text>
            </View>
          </View>
        </View>

        {/* Tab Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="border-b border-gray-200 dark:border-gray-800"
        >
          <View className="flex-row">
            {['dados', 'planos', 'progresso'].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab as 'dados' | 'planos' | 'progresso')}
                className="px-6 py-4"
              >
                <Text
                  className={`font-semibold capitalize ${
                    activeTab === tab
                      ? 'text-cyan-500'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {tab === 'dados' && 'Dados'}
                  {tab === 'planos' && 'Planos'}
                  {tab === 'progresso' && 'Progresso'}
                </Text>
                {activeTab === tab && (
                  <View className="h-1 bg-cyan-500 mt-2 rounded-full" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Tab Content */}
        <View className="px-4 py-6">
          {/* Dados Tab */}
          {activeTab === 'dados' && (
            <>
              {/* Clinical Profile Card */}
              <Card className="mb-4">
                <CardContent>
                  <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Perfil Clínico
                  </Text>

                  {student.healthProfile.medicalHistory &&
                    student.healthProfile.medicalHistory.length > 0 && (
                      <View className="mb-4">
                        <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Histórico Médico
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                          {student.healthProfile.medicalHistory.map((condition, idx) => (
                            <ConditionBadge
                              key={idx}
                              condition={condition}
                            />
                          ))}
                        </View>
                      </View>
                    )}

                  {student.healthProfile.currentMedications &&
                    student.healthProfile.currentMedications.length > 0 && (
                      <View className="mb-4">
                        <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Medicações Atuais
                        </Text>
                        {student.healthProfile.currentMedications.map((med, idx) => (
                          <View key={idx} className="flex-row items-center mb-2">
                            <Feather
                              name="pill"
                              size={16}
                              color="#0ea5e9"
                              className="mr-2"
                            />
                            <Text className="text-sm text-gray-700 dark:text-gray-300">
                              {med}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                  {student.healthProfile.limitations &&
                    student.healthProfile.limitations.length > 0 && (
                      <View>
                        <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Limitações Físicas
                        </Text>
                        {student.healthProfile.limitations.map((limitation, idx) => (
                          <View key={idx} className="flex-row items-center mb-2">
                            <Feather
                              name="alert-circle"
                              size={16}
                              color="#f59e0b"
                              className="mr-2"
                            />
                            <Text className="text-sm text-gray-700 dark:text-gray-300">
                              {limitation}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                  {!student.healthProfile.medicalHistory?.length &&
                    !student.healthProfile.currentMedications?.length &&
                    !student.healthProfile.limitations?.length && (
                      <Text className="text-sm text-gray-500 dark:text-gray-400">
                        Nenhuma informação clínica registrada
                      </Text>
                    )}
                </CardContent>
              </Card>

              {/* Training Preferences Card */}
              <Card className="mb-4">
                <CardContent>
                  <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Preferências de Treinamento
                  </Text>

                  {student.trainingPreferences.goals &&
                    student.trainingPreferences.goals.length > 0 && (
                      <View className="mb-4">
                        <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Objetivos
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                          {student.trainingPreferences.goals.map((goal, idx) => (
                            <Badge
                              key={idx}
                              label={goal}
                              variant="primary"
                              color="bg-teal-100 dark:bg-teal-900"
                              textColor="text-teal-800 dark:text-teal-200"
                            />
                          ))}
                        </View>
                      </View>
                    )}

                  {student.trainingPreferences.availableDays &&
                    student.trainingPreferences.availableDays.length > 0 && (
                      <View className="mb-4">
                        <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Dias Disponíveis
                        </Text>
                        <Text className="text-sm text-gray-700 dark:text-gray-300">
                          {student.trainingPreferences.availableDays.join(', ')}
                        </Text>
                      </View>
                    )}

                  {student.trainingPreferences.sessionDuration && (
                    <View>
                      <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Duração da Sessão
                      </Text>
                      <Text className="text-sm text-gray-700 dark:text-gray-300">
                        {student.trainingPreferences.sessionDuration} minutos
                      </Text>
                    </View>
                  )}
                </CardContent>
              </Card>

              {/* Body Metrics Card */}
              <Card className="mb-6">
                <CardContent>
                  <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Métricas Corporais
                  </Text>

                  <View className="flex-row justify-between">
                    <View className="flex-1 mr-2">
                      <Text className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Altura
                      </Text>
                      <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                        {student.healthProfile.height}
                      </Text>
                      <Text className="text-xs text-gray-500 dark:text-gray-500">
                        cm
                      </Text>
                    </View>

                    <View className="flex-1 mx-2">
                      <Text className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Peso
                      </Text>
                      <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                        {student.healthProfile.weight}
                      </Text>
                      <Text className="text-xs text-gray-500 dark:text-gray-500">
                        kg
                      </Text>
                    </View>

                    <View className="flex-1 ml-2">
                      <Text className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        IMC
                      </Text>
                      <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                        {bmi}
                      </Text>
                      <Text className="text-xs text-gray-500 dark:text-gray-500">
                        kg/m²
                      </Text>
                    </View>
                  </View>
                </CardContent>
              </Card>
            </>
          )}

          {/* Planos Tab */}
          {activeTab === 'planos' && (
            <>
              {trainingPlans.length > 0 ? (
                <View className="mb-6">
                  {trainingPlans.map((plan) => (
                    <TouchableOpacity
                      key={plan.id}
                      onPress={() => router.push(`/plano/${plan.id}`)}
                      className="mb-3"
                    >
                      <Card>
                        <CardContent>
                          <View className="flex-row items-center justify-between mb-3">
                            <Text className="text-lg font-bold text-gray-900 dark:text-white flex-1">
                              {plan.title}
                            </Text>
                            <Badge
                              label={plan.isActive ? 'Ativo' : 'Inativo'}
                              variant={plan.isActive ? 'success' : 'secondary'}
                              color={
                                plan.isActive
                                  ? 'bg-green-100 dark:bg-green-900'
                                  : 'bg-gray-200 dark:bg-gray-700'
                              }
                              textColor={
                                plan.isActive
                                  ? 'text-green-800 dark:text-green-200'
                                  : 'text-gray-800 dark:text-gray-300'
                              }
                            />
                          </View>

                          <View className="flex-row items-center text-sm text-gray-600 dark:text-gray-400">
                            <Feather name="calendar" size={14} className="mr-2" />
                            <Text className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(plan.startDate).toLocaleDateString('pt-BR')} até{' '}
                              {new Date(plan.endDate).toLocaleDateString('pt-BR')}
                            </Text>
                          </View>
                        </CardContent>
                      </Card>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View className="flex-row flex-col items-center justify-center py-12">
                  <Ionicons
                    name="document-outline"
                    size={48}
                    color="#9ca3af"
                    className="mb-4"
                  />
                  <Text className="text-gray-600 dark:text-gray-400 text-center mb-4">
                    Nenhum plano gerado
                  </Text>
                  <Button
                    title="Gerar Novo Plano"
                    onPress={() => router.push(`/gerar-plano/${id}`)}
                    variant="primary"
                  />
                </View>
              )}
            </>
          )}

          {/* Progresso Tab */}
          {activeTab === 'progresso' && (
            <>
              {/* Latest Metrics */}
              {progressRecords.length > 0 && (
                <View className="mb-6">
                  <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Métricas Recentes
                  </Text>
                  <View className="flex-row gap-3">
                    {progressRecords.slice(0, 2).map((record, idx) => (
                      <MetricCard
                        key={idx}
                        label={record.metricType === 'weight' ? 'Peso' : 'Gordura Corporal'}
                        value={`${record.value.toFixed(1)}${
                          record.metricType === 'weight' ? ' kg' : '%'
                        }`}
                        date={new Date(record.recordedAt).toLocaleDateString('pt-BR')}
                        variant={idx === 0 ? 'primary' : 'secondary'}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Recent Assessments */}
              {assessments.length > 0 ? (
                <View className="mb-6">
                  <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Avaliações Recentes
                  </Text>
                  {assessments.slice(0, 5).map((assessment) => (
                    <Card key={assessment.id} className="mb-3">
                      <CardContent>
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1">
                            <Text className="font-semibold text-gray-900 dark:text-white">
                              {assessment.type}
                            </Text>
                            <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {new Date(assessment.createdAt).toLocaleDateString('pt-BR')}
                            </Text>
                          </View>
                          <Feather
                            name="chevron-right"
                            size={20}
                            color="#0ea5e9"
                          />
                        </View>
                      </CardContent>
                    </Card>
                  ))}
                </View>
              ) : (
                <View className="flex-row flex-col items-center justify-center py-12">
                  <Ionicons
                    name="checkmark-done-outline"
                    size={48}
                    color="#9ca3af"
                    className="mb-4"
                  />
                  <Text className="text-gray-600 dark:text-gray-400 text-center mb-4">
                    Nenhuma avaliação registrada
                  </Text>
                </View>
              )}

              <Button
                title="Adicionar Avaliação"
                onPress={() => router.push(`/avaliacao/novo/${id}`)}
                variant="primary"
                className="mb-6"
              />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
