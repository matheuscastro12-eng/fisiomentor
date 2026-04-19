import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';

import { createStudent } from '@/lib/api';
import { Card, CardContent, Badge, Button, Input } from '@/components/ui';

const COMMON_CONDITIONS = [
  'Hipertensão',
  'Diabetes T2',
  'Diabetes T1',
  'Obesidade',
  'Cardiopatia',
  'DPOC',
  'Osteoporose',
  'Artrose',
  'Hérnia',
  'AVC',
  'Lombalgia',
  'Fibromialgia',
];

const COMMON_GOALS = [
  'Emagrecimento',
  'Hipertrofia',
  'Condicionamento',
  'Reabilitação',
  'Mobilidade',
  'Força',
  'Qualidade de vida',
];

interface FormData {
  // Step 1: Dados Pessoais
  fullName: string;
  dateOfBirth: string;
  gender: 'masculino' | 'feminino' | 'outro' | '';
  email: string;

  // Step 2: Perfil Clínico
  clinicalConditions: string[];
  customCondition: string;
  cardiovascularRisk: 'baixo' | 'moderado' | 'alto' | '';

  // Step 3: Medicamentos
  medications: { name: string; dosage: string }[];
  medicationName: string;
  medicationDosage: string;

  // Step 4: Preferências de Treino
  goals: string[];
  sessionsPerWeek: number;
  sessionDuration: number;
  experienceLevel: 'iniciante' | 'intermediario' | 'avancado' | '';

  // Errors
  errors: { [key: string]: string };
}

type Step = 1 | 2 | 3 | 4 | 5;

export default function NovoAlunoScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    clinicalConditions: [],
    customCondition: '',
    cardiovascularRisk: '',
    medications: [],
    medicationName: '',
    medicationDosage: '',
    goals: [],
    sessionsPerWeek: 3,
    sessionDuration: 60,
    experienceLevel: '',
    errors: {},
  });

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({
      ...prev,
      ...updates,
      errors: { ...prev.errors },
    }));
  };

  const formatDate = (input: string): string => {
    const digits = input.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  };

  const validateStep = (step: Step): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (step === 1) {
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Nome completo é obrigatório';
      }
      if (!formData.dateOfBirth.trim()) {
        newErrors.dateOfBirth = 'Data de nascimento é obrigatória';
      } else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(formData.dateOfBirth)) {
        newErrors.dateOfBirth = 'Formato inválido (DD/MM/AAAA)';
      }
    }

    setFormData((prev) => ({ ...prev, errors: newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 5) {
        setCurrentStep((prev) => (prev + 1) as Step);
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    } else {
      router.back();
    }
  };

  const handleCreateStudent = async () => {
    try {
      setIsLoading(true);

      // Parse date from DD/MM/AAAA to ISO format
      const [day, month, year] = formData.dateOfBirth.split('/');
      const isoDate = `${year}-${month}-${day}`;

      const payload = {
        name: formData.fullName,
        dateOfBirth: isoDate,
        gender: formData.gender || undefined,
        email: formData.email || undefined,
        clinicalConditions: formData.clinicalConditions,
        cardiovascularRisk: formData.cardiovascularRisk || undefined,
        medications: formData.medications,
        goals: formData.goals,
        sessionsPerWeek: formData.sessionsPerWeek,
        sessionDuration: formData.sessionDuration,
        experienceLevel: formData.experienceLevel || undefined,
      };

      const newStudent = await createStudent(payload);

      Alert.alert('Sucesso', 'Aluno cadastrado com sucesso!', [
        {
          text: 'OK',
          onPress: () => {
            router.push(`/aluno/${newStudent.id}`);
          },
        },
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro ao cadastrar aluno';
      Alert.alert('Erro', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const completedSteps = currentStep - 1;

  // Step indicator
  const renderStepIndicator = () => (
    <View className="px-4 py-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <View className="flex-row items-center justify-between">
        {[1, 2, 3, 4, 5].map((step, index) => {
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;

          return (
            <View key={step} className="flex-1 items-center">
              <View className="items-center">
                <View
                  className={`w-8 h-8 rounded-full items-center justify-center ${
                    isCompleted
                      ? 'bg-teal-500 dark:bg-teal-600'
                      : isCurrent
                        ? 'bg-teal-500 dark:bg-teal-600'
                        : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  {isCompleted ? (
                    <Feather name="check" color="#fff" size={16} />
                  ) : (
                    <Text className="text-white font-bold text-xs">{step}</Text>
                  )}
                </View>
                <Text
                  className={`text-xs mt-2 text-center ${
                    isCurrent
                      ? 'text-teal-600 dark:text-teal-400 font-semibold'
                      : isCompleted
                        ? 'text-teal-600 dark:text-teal-400'
                        : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {['Pessoais', 'Clínico', 'Medicamentos', 'Treino', 'Revisão'][
                    index
                  ]}
                </Text>
              </View>

              {index < 4 && (
                <View
                  className={`absolute top-4 w-full h-0.5 z-0 ${
                    isCompleted
                      ? 'bg-teal-500 dark:bg-teal-600'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  style={{
                    left: '50%',
                    width: 'calc(50% - 20px)',
                  }}
                />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );

  // Step 1: Dados Pessoais
  const renderStep1 = () => (
    <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
      <Card className="mb-4">
        <CardContent className="gap-4">
          <Input
            label="Nome completo"
            value={formData.fullName}
            onChangeText={(text) => updateFormData({ fullName: text })}
            placeholder="Ex: João Silva"
            error={formData.errors.fullName}
          />

          <Input
            label="Data de nascimento"
            value={formData.dateOfBirth}
            onChangeText={(text) =>
              updateFormData({ dateOfBirth: formatDate(text) })
            }
            placeholder="DD/MM/AAAA"
            maxLength={10}
            error={formData.errors.dateOfBirth}
          />

          <View>
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Gênero
            </Text>
            <View className="flex-row gap-2">
              {['Masculino', 'Feminino', 'Outro'].map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() =>
                    updateFormData({
                      gender: option.toLowerCase() as
                        | 'masculino'
                        | 'feminino'
                        | 'outro',
                    })
                  }
                  className={`flex-1 py-2 px-3 rounded-lg border ${
                    formData.gender === option.toLowerCase()
                      ? 'bg-teal-500 dark:bg-teal-600 border-teal-600 dark:border-teal-700'
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
                  }`}
                >
                  <Text
                    className={`text-center text-sm font-medium ${
                      formData.gender === option.toLowerCase()
                        ? 'text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Input
            label="Email (opcional)"
            value={formData.email}
            onChangeText={(text) => updateFormData({ email: text })}
            placeholder="seu@email.com"
            keyboardType="email-address"
          />
        </CardContent>
      </Card>
    </ScrollView>
  );

  // Step 2: Perfil Clínico
  const renderStep2 = () => (
    <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
      <Card className="mb-4">
        <CardContent className="gap-4">
          <View>
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Condições Clínicas
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {COMMON_CONDITIONS.map((condition) => (
                <TouchableOpacity
                  key={condition}
                  onPress={() => {
                    const updated = formData.clinicalConditions.includes(
                      condition
                    )
                      ? formData.clinicalConditions.filter(
                          (c) => c !== condition
                        )
                      : [...formData.clinicalConditions, condition];
                    updateFormData({ clinicalConditions: updated });
                  }}
                  className={`px-3 py-2 rounded-full border ${
                    formData.clinicalConditions.includes(condition)
                      ? 'bg-teal-500 dark:bg-teal-600 border-teal-600 dark:border-teal-700'
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      formData.clinicalConditions.includes(condition)
                        ? 'text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {condition}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <View className="flex-row gap-2 items-end">
              <View className="flex-1">
                <Input
                  label="Outra condição"
                  value={formData.customCondition}
                  onChangeText={(text) =>
                    updateFormData({ customCondition: text })
                  }
                  placeholder="Digite uma condição"
                />
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (formData.customCondition.trim()) {
                    const updated = [
                      ...formData.clinicalConditions,
                      formData.customCondition,
                    ];
                    updateFormData({
                      clinicalConditions: updated,
                      customCondition: '',
                    });
                  }
                }}
                className="bg-teal-500 dark:bg-teal-600 px-4 py-2 rounded-lg mb-1"
              >
                <Feather name="plus" color="#fff" size={20} />
              </TouchableOpacity>
            </View>
          </View>

          <View className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Risco Cardiovascular
            </Text>
            <View className="flex-row gap-2">
              {[
                { label: 'Baixo', value: 'baixo', color: 'green' },
                { label: 'Moderado', value: 'moderado', color: 'yellow' },
                { label: 'Alto', value: 'alto', color: 'red' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() =>
                    updateFormData({
                      cardiovascularRisk: option.value as
                        | 'baixo'
                        | 'moderado'
                        | 'alto',
                    })
                  }
                  className={`flex-1 py-2 px-3 rounded-lg border ${
                    formData.cardiovascularRisk === option.value
                      ? `bg-${option.color}-500 dark:bg-${option.color}-600 border-${option.color}-600 dark:border-${option.color}-700`
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
                  }`}
                >
                  <Text
                    className={`text-center text-sm font-medium ${
                      formData.cardiovascularRisk === option.value
                        ? 'text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </CardContent>
      </Card>
    </ScrollView>
  );

  // Step 3: Medicamentos
  const renderStep3 = () => (
    <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
      <Card className="mb-4">
        <CardContent className="gap-4">
          {formData.medications.length === 0 ? (
            <View className="py-8 items-center">
              <Text className="text-gray-500 dark:text-gray-400 text-sm">
                Nenhum medicamento cadastrado
              </Text>
            </View>
          ) : (
            <View className="gap-2 mb-4">
              {formData.medications.map((med, index) => (
                <View
                  key={index}
                  className="flex-row items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                      {med.name}
                    </Text>
                    <Text className="text-xs text-gray-600 dark:text-gray-400">
                      {med.dosage}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      const updated = formData.medications.filter(
                        (_, i) => i !== index
                      );
                      updateFormData({ medications: updated });
                    }}
                    className="p-2"
                  >
                    <Feather name="trash-2" color="#ef4444" size={18} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <View className="gap-2">
              <Input
                label="Medicamento"
                value={formData.medicationName}
                onChangeText={(text) =>
                  updateFormData({ medicationName: text })
                }
                placeholder="Nome do medicamento"
              />

              <Input
                label="Dosagem"
                value={formData.medicationDosage}
                onChangeText={(text) =>
                  updateFormData({ medicationDosage: text })
                }
                placeholder="Ex: 500mg 2x ao dia"
              />

              <TouchableOpacity
                onPress={() => {
                  if (
                    formData.medicationName.trim() &&
                    formData.medicationDosage.trim()
                  ) {
                    const updated = [
                      ...formData.medications,
                      {
                        name: formData.medicationName,
                        dosage: formData.medicationDosage,
                      },
                    ];
                    updateFormData({
                      medications: updated,
                      medicationName: '',
                      medicationDosage: '',
                    });
                  }
                }}
                className="bg-teal-500 dark:bg-teal-600 py-2 px-4 rounded-lg items-center"
              >
                <Text className="text-white font-semibold text-sm">
                  Adicionar Medicamento
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </CardContent>
      </Card>
    </ScrollView>
  );

  // Step 4: Preferências de Treino
  const renderStep4 = () => (
    <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
      <Card className="mb-4">
        <CardContent className="gap-4">
          <View>
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Objetivos
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {COMMON_GOALS.map((goal) => (
                <TouchableOpacity
                  key={goal}
                  onPress={() => {
                    const updated = formData.goals.includes(goal)
                      ? formData.goals.filter((g) => g !== goal)
                      : [...formData.goals, goal];
                    updateFormData({ goals: updated });
                  }}
                  className={`px-3 py-2 rounded-full border ${
                    formData.goals.includes(goal)
                      ? 'bg-teal-500 dark:bg-teal-600 border-teal-600 dark:border-teal-700'
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      formData.goals.includes(goal)
                        ? 'text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {goal}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Sessões por semana
            </Text>
            <View className="flex-row gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <TouchableOpacity
                  key={num}
                  onPress={() => updateFormData({ sessionsPerWeek: num })}
                  className={`flex-1 py-2 rounded-lg border ${
                    formData.sessionsPerWeek === num
                      ? 'bg-teal-500 dark:bg-teal-600 border-teal-600 dark:border-teal-700'
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
                  }`}
                >
                  <Text
                    className={`text-center text-sm font-bold ${
                      formData.sessionsPerWeek === num
                        ? 'text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Duração da sessão (minutos)
            </Text>
            <View className="flex-row gap-2">
              {[30, 45, 60, 90].map((duration) => (
                <TouchableOpacity
                  key={duration}
                  onPress={() =>
                    updateFormData({ sessionDuration: duration })
                  }
                  className={`flex-1 py-2 rounded-lg border ${
                    formData.sessionDuration === duration
                      ? 'bg-teal-500 dark:bg-teal-600 border-teal-600 dark:border-teal-700'
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
                  }`}
                >
                  <Text
                    className={`text-center text-sm font-semibold ${
                      formData.sessionDuration === duration
                        ? 'text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {duration}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Nível de experiência
            </Text>
            <View className="flex-row gap-2">
              {['Iniciante', 'Intermediário', 'Avançado'].map((level) => (
                <TouchableOpacity
                  key={level}
                  onPress={() =>
                    updateFormData({
                      experienceLevel: level.toLowerCase().replace(
                        'intermediário',
                        'intermediario'
                      ) as
                        | 'iniciante'
                        | 'intermediario'
                        | 'avancado',
                    })
                  }
                  className={`flex-1 py-2 px-3 rounded-lg border ${
                    formData.experienceLevel ===
                    level.toLowerCase().replace('intermediário', 'intermediario')
                      ? 'bg-teal-500 dark:bg-teal-600 border-teal-600 dark:border-teal-700'
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
                  }`}
                >
                  <Text
                    className={`text-center text-xs font-medium ${
                      formData.experienceLevel ===
                      level.toLowerCase().replace('intermediário', 'intermediario')
                        ? 'text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </CardContent>
      </Card>
    </ScrollView>
  );

  // Step 5: Revisão e Confirmação
  const renderStep5 = () => (
    <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
      {/* Dados Pessoais Summary */}
      <Card className="mb-3">
        <CardContent className="gap-2">
          <Text className="text-sm font-bold text-gray-900 dark:text-white">
            Dados Pessoais
          </Text>
          <View className="gap-1">
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-600 dark:text-gray-400">
                Nome:
              </Text>
              <Text className="text-xs font-semibold text-gray-900 dark:text-white">
                {formData.fullName}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-600 dark:text-gray-400">
                Data de Nascimento:
              </Text>
              <Text className="text-xs font-semibold text-gray-900 dark:text-white">
                {formData.dateOfBirth}
              </Text>
            </View>
            {formData.gender && (
              <View className="flex-row justify-between">
                <Text className="text-xs text-gray-600 dark:text-gray-400">
                  Gênero:
                </Text>
                <Text className="text-xs font-semibold text-gray-900 dark:text-white capitalize">
                  {formData.gender}
                </Text>
              </View>
            )}
            {formData.email && (
              <View className="flex-row justify-between">
                <Text className="text-xs text-gray-600 dark:text-gray-400">
                  Email:
                </Text>
                <Text className="text-xs font-semibold text-gray-900 dark:text-white">
                  {formData.email}
                </Text>
              </View>
            )}
          </View>
        </CardContent>
      </Card>

      {/* Perfil Clínico Summary */}
      <Card className="mb-3">
        <CardContent className="gap-2">
          <Text className="text-sm font-bold text-gray-900 dark:text-white">
            Perfil Clínico
          </Text>
          {formData.clinicalConditions.length > 0 && (
            <View className="gap-1">
              <Text className="text-xs text-gray-600 dark:text-gray-400">
                Condições:
              </Text>
              <View className="flex-row flex-wrap gap-1.5">
                {formData.clinicalConditions.map((condition) => (
                  <Badge key={condition} variant="default" label={condition} />
                ))}
              </View>
            </View>
          )}
          {formData.cardiovascularRisk && (
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-600 dark:text-gray-400">
                Risco Cardiovascular:
              </Text>
              <Badge
                variant={
                  formData.cardiovascularRisk === 'baixo'
                    ? 'green'
                    : formData.cardiovascularRisk === 'moderado'
                      ? 'yellow'
                      : 'red'
                }
                label={formData.cardiovascularRisk}
              />
            </View>
          )}
        </CardContent>
      </Card>

      {/* Medicamentos Summary */}
      <Card className="mb-3">
        <CardContent className="gap-2">
          <Text className="text-sm font-bold text-gray-900 dark:text-white">
            Medicamentos
          </Text>
          {formData.medications.length > 0 ? (
            <View className="gap-1">
              {formData.medications.map((med, index) => (
                <View key={index} className="border-l-2 border-teal-500 pl-2">
                  <Text className="text-xs font-semibold text-gray-900 dark:text-white">
                    {med.name}
                  </Text>
                  <Text className="text-xs text-gray-600 dark:text-gray-400">
                    {med.dosage}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-xs text-gray-600 dark:text-gray-400">
              Nenhum medicamento registrado
            </Text>
          )}
        </CardContent>
      </Card>

      {/* Preferências de Treino Summary */}
      <Card className="mb-6">
        <CardContent className="gap-2">
          <Text className="text-sm font-bold text-gray-900 dark:text-white">
            Preferências de Treino
          </Text>
          {formData.goals.length > 0 && (
            <View className="gap-1">
              <Text className="text-xs text-gray-600 dark:text-gray-400">
                Objetivos:
              </Text>
              <View className="flex-row flex-wrap gap-1.5">
                {formData.goals.map((goal) => (
                  <Badge key={goal} variant="default" label={goal} />
                ))}
              </View>
            </View>
          )}
          <View className="gap-1">
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-600 dark:text-gray-400">
                Sessões/semana:
              </Text>
              <Text className="text-xs font-semibold text-gray-900 dark:text-white">
                {formData.sessionsPerWeek}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-600 dark:text-gray-400">
                Duração da sessão:
              </Text>
              <Text className="text-xs font-semibold text-gray-900 dark:text-white">
                {formData.sessionDuration} min
              </Text>
            </View>
            {formData.experienceLevel && (
              <View className="flex-row justify-between">
                <Text className="text-xs text-gray-600 dark:text-gray-400">
                  Experiência:
                </Text>
                <Text className="text-xs font-semibold text-gray-900 dark:text-white capitalize">
                  {formData.experienceLevel}
                </Text>
              </View>
            )}
          </View>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <View className="gap-2 pb-4">
        <Button
          title={isLoading ? 'Cadastrando...' : 'Cadastrar Aluno'}
          onPress={handleCreateStudent}
          disabled={isLoading}
          variant="primary"
          size="default"
        />
        <Button
          title="Voltar e Editar"
          onPress={() => setCurrentStep(1)}
          variant="ghost"
          size="default"
        />
      </View>
    </ScrollView>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <TouchableOpacity onPress={handlePreviousStep} className="p-2">
            <Feather name="chevron-left" color="#0ea5e9" size={24} />
          </TouchableOpacity>
          <Text className="text-base font-semibold text-gray-900 dark:text-white">
            Novo Aluno
          </Text>
          <View className="w-10" />
        </View>

        {renderStepIndicator()}

        {renderCurrentStep()}

        {currentStep < 5 && (
          <View className="border-t border-gray-200 dark:border-gray-800 px-4 py-3 gap-2 bg-white dark:bg-gray-900">
            <Button
              title="Próximo"
              onPress={handleNextStep}
              variant="primary"
              size="default"
            />
            <Button
              title="Anterior"
              onPress={handlePreviousStep}
              variant="ghost"
              size="default"
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
