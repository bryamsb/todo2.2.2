import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LocalStorageService } from './local-storage.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';  // Importar HttpClientModule y HttpClient

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule, HttpClientModule], // Añadir HttpClientModule aquí
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'todolistapp';
  fecha: string = '';
  actividad: string = '';
  prioridad: string = 'Importante'; 
  actividades: any[] = []; 
  editIndex: number | null = null; 
  actividades2: any[] = []; 
  actividadesRealizadas: any[] = []; 
  actividadesPendientes: any[] = []; 
  actividadesRealizadasFecha: any[] = [];
  None: any;

  constructor(private localStorageService: LocalStorageService, private http: HttpClient) {
    this.cargarActividades(); 
  }

  obtenerFecha(): string {
    const fecha = new Date();
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear().toString();
    return `${dia}/${mes}/${anio}`;
  }

  registrarActividad() {
    const actividadInput = (document.getElementById('inputText') as HTMLInputElement).value;
    const prioridadInput = (document.querySelector('.form-select') as HTMLSelectElement).value;
    this.prioridad = prioridadInput || 'Importante';

    if (actividadInput) {
      const fecha = this.obtenerFecha();  // Obtenemos la fecha actual

      const actividadData = {
        actividad: actividadInput,
        prioridad: this.prioridad,
        estado: 'pendiente',
        fecha: fecha
      };

      if (this.editIndex !== null) {
        this.actividades[this.editIndex] = actividadData;
        this.localStorageService.setItem('actividades', JSON.stringify(this.actividades));
        console.log('Actividades guardadas en localStorage en: actividades');
        this.editIndex = null; 
      } else {
        const actividades = JSON.parse(this.localStorageService.getItem('actividades') || '[]');
        actividades.push(actividadData);
        this.localStorageService.setItem('actividades', JSON.stringify(actividades));
        console.log('Actividades guardadas en localStorage en: actividades');
      }

      this.enviarActividadAPI(actividadData);

      this.cargarActividades(); 
      this.ordenarActividadesPorPrioridad();
      this.limpiarFormulario();
    } else {
      alert('Ingrese una actividad.');
    }
  }

  ordenarActividadesPorPrioridad() {
    const prioridades = { 'Muy importante': 1, 'Importante': 2, 'Poco importante': 3 };
    this.actividades.sort((a, b) => {
      return prioridades[a.prioridad as keyof typeof prioridades] - prioridades[b.prioridad as keyof typeof prioridades];
    });
    this.localStorageService.setItem('actividades', JSON.stringify(this.actividades));
    console.log('Actividades ordenadas por prioridad y guardadas en localStorage en: actividades');
  }

  cargarActividades() {
    const actividadesGuardadas = JSON.parse(this.localStorageService.getItem('actividades') || '[]');
    this.actividades = actividadesGuardadas.filter((actividad: { estado: string; }) => actividad.estado === 'pendiente');
  }

  limpiarFormulario() {
    (document.getElementById('inputText') as HTMLInputElement).value = '';
    (document.querySelector('.form-select') as HTMLSelectElement).selectedIndex = 0;
    this.editIndex = null; 
  }

  enviarActividadAPI(actividadData: any) {
    const formData = new FormData();
    const actividadJson = JSON.stringify(actividadData);
    const blob = new Blob([actividadJson], { type: 'application/json' });
  
    const fechaArchivo = actividadData.fecha.replace(/\//g, '-'); // Convertimos "25/11/2024" a "25-11-2024"
    const nombreArchivo = `${fechaArchivo}.json`;
  
    formData.append('file', blob, nombreArchivo);
  
    this.http.post('https://api.escuelajs.co/api/v1/files/upload', formData).subscribe(
      response => {
        console.log(`Actividad subida con éxito: ${nombreArchivo}`, response);
      },
      error => {
        console.error('Error al subir la actividad a la API', error);
      }
    );
  }

  eliminarActividad(index: number) {
    this.actividades.splice(index, 1);
    this.localStorageService.setItem('actividades', JSON.stringify(this.actividades));
    console.log('Actividad eliminada y guardada en localStorage en: actividades');
  }

  marcarComoHecho(index: number) {
    const actividadRealizada = this.actividades[index];
    actividadRealizada.estado = 'realizado';

    const actividadesRealizadas = JSON.parse(this.localStorageService.getItem('actividadesRealizadas') || '[]');
    actividadesRealizadas.push(actividadRealizada);
    this.localStorageService.setItem('actividadesRealizadas', JSON.stringify(actividadesRealizadas));

    this.actividades.splice(index, 1);
    this.localStorageService.setItem('actividades', JSON.stringify(this.actividades));

    this.enviarActividadAPI(actividadRealizada);
  }

  getActividadesRealizadas() {
    return JSON.parse(this.localStorageService.getItem('actividadesRealizadas') || '[]');
  }

  vaciarActividadesRealizadas() {
    this.localStorageService.setItem('actividadesRealizadas', JSON.stringify([]));
    console.log('Actividades realizadas vaciadas y guardadas en localStorage en: actividadesRealizadas');
  }

  vaciarPendientes() {
    this.localStorageService.setItem('actividades', JSON.stringify([]));
    console.log('Actividades pendientes vaciadas y guardadas en localStorage en: actividades');
    this.cargarActividades();
  }

  vaciarTodo() {
    this.localStorageService.setItem('actividadesRealizadas', JSON.stringify([]));
    this.localStorageService.setItem('actividades', JSON.stringify([]));
    console.log('Todo vacío y guardado en localStorage en: actividadesRealizadas y actividades');
    this.cargarActividades();
  }

  editarActividad(index: number) {
    const actividad = this.actividades[index];
    (document.getElementById('inputText') as HTMLInputElement).value = actividad.actividad;
    (document.querySelector('.form-select') as HTMLSelectElement).value = actividad.prioridad;
    this.editIndex = index; 
  }

  formatearFecha() {
    if (this.fecha) {
      this.fecha = this.fecha.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3');
    }
  }

  // buscarFecha() {
  //   if (this.fecha.length === 10) {
  //     const filename = `actividades-${this.fecha.replace(/\//g, '-')}.json`; 
  //     const url = `https://api.escuelajs.co/api/v1/files/${filename}`;
    
  //     this.http.head(url).subscribe(
  //       () => {
          
  //         this.http.get<any>(url).subscribe(
  //           (response) => {
  //             let actividadesFiltradas: any[] = [];
              
  //             if (Array.isArray(response)) {
  //               actividadesFiltradas = response.filter((actividad: any) => actividad.fecha === this.fecha);
  //             } else if (typeof response === 'object') {
  //               if (response.fecha === this.fecha) {
  //                 actividadesFiltradas = [response];
  //               }
  //             } else {
  //               console.error('Formato desconocido en la respuesta:', response);
  //               alert('Formato desconocido en los datos de la actividad.');
  //               return;
  //             }
  
  //             this.actividadesPendientes = actividadesFiltradas.filter((actividad: any) => actividad.estado === 'pendiente');
  //             this.actividadesRealizadasFecha = actividadesFiltradas.filter((actividad: any) => actividad.estado === 'realizado');
  
  //             this.actividades = this.actividadesPendientes;
  //             this.actividadesRealizadas = this.actividadesRealizadasFecha;
  
  //             localStorage.setItem('actividades2', JSON.stringify(this.actividades));
  //             localStorage.setItem('actividadesRealizadas', JSON.stringify(this.actividadesRealizadas));
  //             console.log('Actividades cargadas correctamente');
  //           },
  //           (error) => {
  //             console.error('Error al buscar las actividades:', error);
  //             alert('Error');
  //           }
  //         );
  //       },
  //       (error) => {
  //         console.error('Archivo no encontrado:', error);
  //         alert('No se encontraron actividades.');
  //       }
  //     );
  //   }
  // }
  

  ngOnInit() {
    const actividadesPendientesLocal = localStorage.getItem('actividades');
    const actividadesRealizadasLocal = localStorage.getItem('actividadesRealizadas');
  
    if (actividadesPendientesLocal) {
      this.actividades = JSON.parse(actividadesPendientesLocal);
    }
  
    if (actividadesRealizadasLocal) {
      this.actividadesRealizadas = JSON.parse(actividadesRealizadasLocal);
    }
  }
}
