import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { getStudents, generatePlan } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge, ConditionBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import type { Student, PaginatedResponse, TrainingPlan } from '@/lib/types';

// Helper to calculate age from date of birth
function calculateAge(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

type ScreenState = 'idle' | 'selected' | 'generating' | 'success' | 'error';

const HIGH_RISK_CONDITIONS = [
  'Cardiopatia',
  'Insuficiência Cardíaca',
  'AVC',
  'DPOC',
];

export default function GerarTreinoScreen() {
  const router = useRouter();
  const [state, setState] = useState<ScreenState>('idle');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingError, setGeneratingError] = useState<string | null>(null);

  // Load students on mount
  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: PaginatedResponse<Student> = await getStudents({
        pageSize: 100,
      });
      setStudents(response.data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao carregar alunos';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const selectedStudent = selectedStudentId
    ? students.find((s) => s.id === selectedStudentId)
    : null;

  // Filter students by search query
  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if student has high-risk conditions
  const hasHighRiskConditions =
    selectedStudent?.healthProfile.medicalHistory.some((condition) =>
      HIGH_RISK_CONDITIONS.includes(condition)
    ) ?? false;

  const handleSelectStudent = useCallback((studentId: string) => {
    setSelectedStudentId(studentId);
    setState('selected');
    setNotes('');
  }, []);

  const handleGeneratePlan = async () => {
    if (!selectedStudentId) {
      Alert.alert('Erro', 'Por favor, selecione um aluno');
      return;
    }

    setState('generating');
    setGeneratingError(null);

    try {
      const plan: TrainingPlan = await generatePlan(selectedStudentId, notes);
      setState('success');

      // Navigate after brief success message
      setTimeout(() => {
        router.push(`/plano/${plan.id}`);
      }, 1500);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao gerar plano';
      setGeneratingError(message);
      setState('error');
    }
  };

  const handleRetry = () => {
    setState('selected');
    setGeneratingError(null);
  };

  const handleGoBack = () => {
    setState('idle');
    setSelectedStudentId(null);
    setNotes('');
  };

  // Render student list item
  const renderStudentItem = ({ item }: { item: Student }) => {
    const hasRiskConditions = item.healthProfile.medicalHistory.some((cond) =>
      HIGH_RISK_CONDITIONS.includes(cond)
    );
    const conditionCount = item.healthProfile.medicalHistory.length;

    return (
      <TouchableOpacity
        onPress={() => handleSelectStudent(item.id)}
        className={`px-lg py-md rounded-lg mb-md border-2 ${
          selectedStudentId === item.id
            ? 'border-primary bg-primary/10'
            : 'border-surface-container-high bg-surface-container'
        }`}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text
              className={`text-base font-semibold ${
                selectedStudentId === item.id
                  ? 'text-primary'
                  : 'text-on-surface'
              }`}
            >
              {item.name}
            </Text>
            <Text className="text-xs text-on-surface-variant mt-xs">
              {calculateAge(item.dateOfBirth)} anos
              {conditionCount > 0 ? ` • ${conditionCount} condição(ões)` : ''}
            </Text>
            {hasRiskConditions && (
              <View className="flex-row items-center mt-xs">
                <Ionicons
                  name="alert-circle"
                  size={12}
                  color="#ff6b6b"
                  style={{ marginRight: 4 }}
                />
                <Text className="text-xs text-red-600 dark:text-error">
                  Condições de risco
                </Text>
              </View>
            )}
          </View>
          {selectedStudentId === item.id && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color="#42dec3"
              style={{ marginLeft: 12 }}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render idle state (student selection)
  if (state === 'idle') {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <ScrollView className="flex-1 px-lg py-md">
          {/* Header */}
          <View className="mb-2xl">
            <Text className="text-3xl font-bold text-on-surface">
              Gerar Treino
            </Text>
            <Text className="text-on-surface-variant text-sm mt-xs">
              Selecione um aluno para gerar seu treino personalizado
            </Text>
          </View>

          {/* Search Input */}
          <View className="mb-lg">
            <View className="relative">
              <Feather
                name="search"
                size={18}
                color="#8b9db3"
                style={{ position: 'absolute', left: 12, top: 14 }}
              />
              <TextInput
                placeholder="Pesquisar aluno..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="h-12 pl-10 pr-4 rounded-xl bg-surface-container dark:bg-surface-container-high border border-surface-container-high text-on-surface placeholder:text-on-surface-variant/60"
                placeholderTextColor="#8b9db3"
              />
            </View>
          </View>

          {/* Loading state */}
          {loading ? (
            <View className="flex-1 justify-center items-center py-2xl">
              <Ionicons name="hourglass-outline" size={32} color="#42dec3" />
              <Text className="text-on-surface-variant mt-md">
                Carregando alunos...
              </Text>
            </View>
          ) : error ? (
            <Card className="bg-error/10 border border-error mb-lg">
              <CardContent className="flex-row items-start">
                <Ionicons
                  name="alert-circle"
                  size={20}
                  color="#ff6b6b"
                  style={{ marginRight: 12, marginTop: 2 }}
                />
                <View className="flex-1">
                  <Text className="font-semibold text-error">Erro</Text>
                  <Text className="text-error text-sm mt-xs">{error}</Text>
                </View>
              </CardContent>
            </Card>
          ) : filteredStudents.length === 0 ? (
            <View className="flex-1 justify-center items-center py-2xl">
              <Ionicons
                name="search-outline"
                size={32}
                color="#8b9db3"
              />
              <Text className="text-on-surface-variant mt-md">
                Nenhum aluno encontrado
              </Text>
            </View>
          ) : (
            <>
              <Text className="text-on-surface font-semibold mb-md">
                Alunos ({filteredStudents.length})
              </Text>
              <FlatList
                data={filteredStudents}
                keyExtractor={(item) => item.id}
                renderItem={renderStudentItem}
                scrollEnabled={false}
              />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render selected state (clinical summary + generate)
  if (state === 'selected' && selectedStudent) {
    const age = calculateAge(selectedStudent.dateOfBirth);

    return (
      <SafeAreaView className="flex-1 bg-surface">
        <ScrollView className="flex-1 px-lg py-md">
          {/* Header with back button */}
          <View className="flex-row items-center justify-between mb-2xl">
            <TouchableOpacity onPress={handleGoBack}>
              <Ionicons name="chevron-back" size={24} color="#42dec3" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-on-surface flex-1 ml-md">
              Gerar Treino
            </Text>
          </View>

          {/* Student Clinical Summary Card */}
          <Card className="mb-lg bg-surface-container border border-surface-container-high">
            <CardContent>
              {/* Student header */}
              <View className="flex-row items-start mb-lg">
                <View className="bg-primary rounded-full w-14 h-14 justify-center items-center mr-lg">
                  <Ionicons name="person" size={28} color="#061423" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-on-surface">
                    {selectedStudent.name}
                  </Text>
                  <Text className="text-sm text-on-surface-variant mt-xs">
                    {age} anos
                  </Text>
                </View>
              </View>

              {/* Medical history section */}
              {selectedStudent.healthProfile.medicalHistory.length > 0 && (
                <View className="mb-lg">
                  <Text className="text-xs font-semibold text-on-surface-variant uppercase mb-md">
                    Condições Médicas
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {selectedStudent.healthProfile.medicalHistory.map(
                      (condition, idx) => (
                        <ConditionBadge
                          key={idx}
                          condition={condition}
                          className="mb-md"
                        />
                      )
                    )}
                  </View>
                </View>
              )}

              {/* Current medications section */}
              {selectedStudent.healthProfile.currentMedications.length > 0 && (
                <View className="mb-lg">
                  <Text className="text-xs font-semibold text-on-surface-variant uppercase mb-md">
                    Medicações
                  </Text>
                  <View className="flex-col gap-1">
                    {selectedStudent.healthProfile.currentMedications.map(
                      (med, idx) => (
                        <View key={idx} className="flex-row items-center">
                          <Ionicons
                            name="medkit"
                            size={14}
                            color="#8b9db3"
                            style={{ marginRight: 8 }}
                          />
                          <Text className="text-sm text-on-surface">
                            {med}
                          </Text>
                        </View>
                      )
                    )}
                  </View>
                </View>
              )}

              {/* Training goals section */}
              {selectedStudent.trainingPreferences.goals.length > 0 && (
                <View>
                  <Text className="text-xs font-semibold text-on-surface-variant uppercase mb-md">
                    Objetivos
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {selectedStudent.trainingPreferences.goals.map(
                      (goal, idx) => (
                        <Badge key={idx} variant="teal" className="mb-md">
                          {goal}
                        </Badge>
                      )
                    )}
                  </View>
                </View>
              )}
            </CardContent>
          </Card>

          {/* High-risk warning */}
          {hasHighRiskConditions && (
            <Card className="mb-lg bg-warning/10 border border-warning">
              <CardContent className="flex-row items-start">
                <Ionicons
                  name="alert-triangle"
                  size={20}
                  color="#ff9800"
                  style={{ marginRight: 12, marginTop: 2 }}
                />
                <View className="flex-1">
                  <Text className="font-semibold text-warning">
                    Atenção: Condições de Alto Risco
                  </Text>
                  <Text className="text-warning text-sm mt-xs">
                    Este paciente possui condições que requerem prescrição cuidadosa. O plano será validado contra protocolos de segurança clínica.
                  </Text>
                </View>
              </CardContent>
            </Card>
          )}

          {/* Professional notes */}
          <View className="mb-lg">
            <Text className="text-sm font-semibold text-on-surface mb-md">
              Observações Profissionais (Opcional)
            </Text>
            <TextInput
              placeholder="Adicione notas que a IA deve considerar ao gerar o treino..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              className="p-4 rounded-xl bg-surface-container dark:bg-surface-container-high border border-surface-container-high text-on-surface placeholder:text-on-surface-variant/60"
              placeholderTextColor="#8b9db3"
              style={{ textAlignVertical: 'top' }}
            />
          </View>

          {/* Generate button */}
          <Button
            variant="primary"
            size="lg"
            onPress={handleGeneratePlan}
            className="mb-lg w-full flex-row justify-center"
          >
            <Feather
              name="zap"
              size={18}
              color="#061423"
              style={{ marginRight: 8 }}
            />
            <Text className="font-semibold text-on-primary">
              Gerar Plano Personalizado
            </Text>
          </Button>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render generating state (LoadingOverlay)
  if (state === 'generating') {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <LoadingOverlay
          visible={true}
          messages={[
            'Buscando diretrizes clínicas...',
            'Analisando perfil do paciente...',
            'Montando prescrição personalizada...',
            'Validando contra regras clínicas...',
          ]}
        />
      </SafeAreaView>
    );
  }

  // Render success state
  if (state === 'success') {
    return (
      <SafeAreaView className="flex-1 bg-surface justify-center items-center">
        <View className="items-center px-lg">
          <View className="bg-success/20 rounded-full w-20 h-20 justify-center items-center mb-lg">
            <Ionicons name="checkmark" size={40} color="#4caf50" />
          </View>
          <Text className="text-2xl font-bold text-on-surface mb-md">
            Plano Gerado com Sucesso!
          </Text>
          <Text className="text-center text-on-surface-variant">
            Abrindo seu treino personalizado...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if (state === 'error') {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <ScrollView className="flex-1 px-lg py-md justify-center">
          <Card className="bg-error/10 border border-error mb-lg">
            <CardContent className="items-center">
              <Ionicons
                name="alert-circle"
                size={32}
                color="#ff6b6b"
                style={{ marginBottom: 12 }}
              />
              <Text className="text-xl font-bold text-error mb-md">
                Erro ao Gerar Plano
              </Text>
              <Text className="text-center text-error text-sm mb-lg">
                {generatingError}
              </Text>
              <View className="flex-row gap-md w-full">
                <Button
                  variant="outline"
                  size="lg"
                  onPress={handleGoBack}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onPress={handleRetry}
                  className="flex-1"
                >
                  Tentar Novamente
                </Button>
              </View>
            </CardContent>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}
