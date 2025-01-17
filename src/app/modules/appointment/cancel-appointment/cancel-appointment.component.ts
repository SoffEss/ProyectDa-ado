import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppointmentService } from '../../../services/appointment.service';
import { SecurityService } from '../../../services/security.service';

@Component({
  selector: 'app-cancel-appointment',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './cancel-appointment.component.html',
  styleUrl: './cancel-appointment.component.css'
})
export class CancelAppointmentComponent {
  fGroup: FormGroup = new FormGroup({});
  appointments: any[] = [];
  patientID: string = '';
  selectedAppointmentId: string = ''; // Propiedad para almacenar el ID de la cita seleccionada

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private securityService: SecurityService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.initDatepickers();
    this.loadPatientID();
    M.Modal.init(document.querySelectorAll('.modal'));
  }


  buildForm(): void {
    this.fGroup = this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required]
    });
  }

// Inicializa los datepickers
  initDatepickers(): void {
    const elems = document.querySelectorAll('.datepicker');

    elems.forEach((elem, index) => {
      const picker = M.Datepicker.init(elem, {
        format: 'yyyy-mm-dd',
        i18n: {
          cancel: 'Cancelar',
          clear: 'Limpiar',
          done: 'Aceptar',
          months: [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
          ],
          monthsShort: [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
          ],
          weekdays: [
            'Domingo', 'Lunes', 'Martes', 'Miércoles',
            'Jueves', 'Viernes', 'Sábado'
          ],
          weekdaysShort: [
            'Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'
          ],
          weekdaysAbbrev: ['D', 'L', 'M', 'M', 'J', 'V', 'S']
        },
        onClose: () => {
          const selectedDate = (elem as HTMLInputElement).value;
          if (index === 0) {
            this.fGroup.get('startDate')?.setValue(selectedDate);
          } else {
            this.fGroup.get('endDate')?.setValue(selectedDate);
          }
        }
      });

      const icon = elem.parentElement?.querySelector('.date-icon');
      icon?.addEventListener('click', () => {
        picker.open();
      });
    });
  }

  // Load the patient ID
  loadPatientID(): void {
    this.securityService.GetUserData().subscribe({
      next: (userData) => {
        this.patientID = userData.dni;
      },
      error: (err) => console.error('Error al cargar el ID del paciente:', err)
    });
  }

  // Search for appointments
  searchAppointments(): void {
    console.log('Formulario:', this.fGroup.value); // Verifica los valores del formulario

    if (this.fGroup.valid) {
      const { startDate, endDate } = this.fGroup.value;

      console.log('Fechas ingresadas:', startDate, endDate); // Verifica las fechas ingresadas

      this.showModal('loadingModal');

      this.appointmentService.getAppointmentsByPatient(startDate, endDate, this.patientID).subscribe({
        next: (data) => {
          this.appointments = data;

          // Para cada cita, obtener el nombre del doctor a partir del DNI utilizando SecurityService
          this.appointments.forEach((appointment, index) => {
            this.securityService.getUserByDNI(appointment.doctor_id).subscribe({
              next: (doctorData) => {
                if (doctorData) {
                  this.appointments[index].doctorName = `${doctorData.first_name} ${doctorData.last_name}`;
                } else {
                  this.appointments[index].doctorName = 'Nombre no disponible';
                }
              },
              error: () => {
                this.appointments[index].doctorName = 'Nombre no disponible';
              }
            });
          });

          console.log('Citas obtenidas:', this.appointments);
          this.closeModal('loadingModal');

          // Mostrar el modal de "sin citas" solo si la búsqueda no retorna resultados
          if (this.appointments.length === 0) {
            this.fGroup.reset();
            this.showModal('noAppointmentsModal');
          }
        },
        error: (err) => {
          console.error('Error al obtener las citas:', err);
          this.closeModal('loadingModal');
          this.showModal('errorModal');
        }
      });
    } else {
      console.warn('Formulario inválido'); // Verifica si el formulario es inválido
      this.showModal('validationErrorModal'); // Mostrar el modal de error si el formulario no es válido
    }
  }

  // Método para abrir el modal de confirmación antes de cancelar
  onCancelAppointment(appointmentId: string): void {
    this.selectedAppointmentId = appointmentId; // Guardar el ID de la cita seleccionada
    this.showModal('confirmCancelModal'); // Mostrar el modal de confirmación
  }

  // Confirma la cancelación de una cita
  confirmCancelAppointment(): void {
    // Cierra el modal de confirmación antes de proceder
    this.closeModal('confirmCancelModal');

    this.appointmentService.cancelAppointment(this.selectedAppointmentId).subscribe({
      next: () => {
        console.log('Cita cancelada con éxito');

        // Actualiza la lista de citas después de cancelar una
        this.appointments = this.appointments.filter(appt => appt.id !== this.selectedAppointmentId);

        // Muestra el modal de éxito
        this.showModal('cancelSuccessModal');

        // Limpia los campos de fecha si ya no hay citas en la lista
        if (this.appointments.length === 0) {
          this.fGroup.reset();
        }
      },
      error: (err) => {
        console.error('Error al cancelar la cita:', err);
      }
    });
  }

  // Mostrar un modal
  showModal(modalId: string, message?: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const instance = M.Modal.getInstance(modalElement);
      if (message) {
        modalElement.querySelector('.modal-content p')!.textContent = message;
      }
      instance.open();
    }
  }

  // Cerrar un modal
  closeModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const instance = M.Modal.getInstance(modalElement);
      instance.close();
    }
  }
}
