import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TextInput, 
  Pressable, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { Agenda, DateData } from 'react-native-calendars';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { useColors } from '@/hooks/useColors';

export default function AgendaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  
  const [items, setItems] = useState<{ [key: string]: any[] }>({});
  const [modalVisible, setModalVisible] = useState(false);
  
  // Por defecto, selecciona el día de hoy
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDesc, setNoteDesc] = useState('');
  const [saving, setSaving] = useState(false);

  // Cargar notas al iniciar o al interactuar con el calendario
  const loadItems = async (day?: DateData) => {
    // Obtenemos las notas de la base de datos
    const { data } = await supabase.from('agenda_notes').select('*');
    
    // Usamos setState con callback para NUNCA perder los datos anteriores
    setItems((prevItems) => {
      const newItems: { [key: string]: any[] } = { ...prevItems };
      
      // SOLUCIÓN AL BUCLE INFINITO: 
      // Llenamos un rango de días alrededor del mes actual con arrays vacíos []. 
      // Si la agenda ve "undefined", se cicla pidiendo datos para siempre.
      if (day && day.timestamp) {
        for (let i = -15; i < 50; i++) {
          const time = day.timestamp + i * 24 * 60 * 60 * 1000;
          const strTime = new Date(time).toISOString().split('T')[0];
          if (!newItems[strTime]) {
            newItems[strTime] = [];
          }
        }
      }

      // Limpiamos los arrays de las fechas que SI tienen notas en la BD
      // para no duplicarlas visualmente al hacer re-render.
      data?.forEach(note => {
        newItems[note.date_string] = [];
      });

      // Llenamos con las notas reales de Supabase
      data?.forEach(note => {
        newItems[note.date_string].push({ 
          id: note.id,
          name: note.title, 
          description: note.description,
          day: note.date_string,
        });
      });

      return newItems;
    });
  };

  useEffect(() => {
    loadItems();
  }, []);

  const saveNote = async () => {
    if (!noteTitle.trim()) return;
    setSaving(true);
    
    await supabase.from('agenda_notes').insert([
      { date_string: selectedDate, title: noteTitle.trim(), description: noteDesc.trim() }
    ]);
    
    setNoteTitle('');
    setNoteDesc('');
    setModalVisible(false);
    setSaving(false);
    
    // Al guardar, forzamos la recarga pasándole el día actual
    const timestamp = new Date(selectedDate).getTime();
    loadItems({ dateString: selectedDate, timestamp } as DateData); 
  };

  // --- RENDERIZADO DE UI ---

  const renderItem = (item: any, isFirst: boolean) => {
    return (
      <Pressable style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemTitle, { color: colors.foreground }]}>{item.name}</Text>
          <View style={[styles.iconBadge, { backgroundColor: colors.primary + '20' }]}>
             <Feather name="file-text" size={14} color={colors.primary} />
          </View>
        </View>
        {item.description ? (
          <Text style={[styles.itemDesc, { color: colors.mutedForeground }]} numberOfLines={3}>
            {item.description}
          </Text>
        ) : null}
      </Pressable>
    );
  };

  const renderEmptyDate = () => {
    return (
      <View style={[styles.emptyContainer]}>
        <Feather name="calendar" size={40} color={colors.border} style={{ marginBottom: 12 }} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Agenda libre para este día</Text>
        <Pressable 
          onPress={() => setModalVisible(true)}
          style={[styles.emptyBtn, { borderColor: colors.primary }]}
        >
          <Text style={[styles.emptyBtnText, { color: colors.primary }]}>+ Agregar una nota</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Agenda
        items={items}
        loadItemsForMonth={loadItems}
        selected={selectedDate}
        onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
        renderItem={renderItem}
        renderEmptyData={renderEmptyDate}
        rowHasChanged={(r1, r2) => r1.id !== r2.id}
        showClosingKnob={true}
        theme={{
          calendarBackground: colors.card,
          agendaKnobColor: colors.primary,
          backgroundColor: colors.background,
          agendaDayTextColor: colors.foreground,
          agendaDayNumColor: colors.foreground,
          agendaTodayColor: colors.primary,
          monthTextColor: colors.foreground,
          textSectionTitleColor: colors.mutedForeground,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: '#000',
          todayTextColor: colors.primary,
          dotColor: colors.primary,
          selectedDotColor: '#000',
        }}
      />

      {/* Botón Flotante (FAB) */}
      <Pressable 
        style={[styles.fab, { backgroundColor: colors.primary, bottom: insets.bottom + 20 }]} 
        onPress={() => setModalVisible(true)}
      >
        <Feather name="plus" size={24} color="#000" />
      </Pressable>

      {/* Modal para nueva nota */}
      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Nueva Nota</Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
            
            <Text style={[styles.dateSubtitle, { color: colors.primary }]}>
              Para el día: {selectedDate}
            </Text>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Título *</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} 
                placeholder="Ej: Seguimiento cliente X" 
                placeholderTextColor={colors.mutedForeground}
                value={noteTitle}
                onChangeText={setNoteTitle} 
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Descripción</Text>
              <TextInput 
                style={[styles.input, styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} 
                placeholder="Detalles de la nota..." 
                placeholderTextColor={colors.mutedForeground}
                multiline 
                numberOfLines={4}
                value={noteDesc}
                onChangeText={setNoteDesc} 
              />
            </View>

            <Pressable 
              onPress={saveNote} 
              disabled={saving || !noteTitle.trim()} 
              style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: (!noteTitle.trim() || saving) ? 0.6 : 1 }]}
            >
              {saving ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.saveBtnText}>Guardar Nota</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Items de la agenda
  itemCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
    marginTop: 17,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    flex: 1,
  },
  iconBadge: {
    padding: 6,
    borderRadius: 8,
  },
  itemDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
  },

  // Estado vacío
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    marginBottom: 16,
  },
  emptyBtn: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  emptyBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },

  // Botón flotante
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
  },
  closeBtn: {
    padding: 4,
  },
  dateSubtitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    marginBottom: 20,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    fontFamily: 'Inter_400Regular',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  saveBtn: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#000',
  }
});