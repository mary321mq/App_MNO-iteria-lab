# NumiLab

<p align="center">
  <img src="public/d.png" alt="NumiLab - estudiante anime de metodos numericos" width="155">
  &nbsp;&nbsp;&nbsp;
  <img src="public/anime-math-guide.png" alt="NumiLab - dragon guia de metodos numericos" width="135">
</p>

<p align="center">
  <strong>Laboratorio de convergencia para resolver raices numericas, paso a paso.</strong>
</p>

<p align="center">
  Explora funciones, detecta raices, analiza iteraciones y exporta resultados listos para estudiar o presentar.
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=111827">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white">
  <img alt="Estado" src="https://img.shields.io/badge/Estado-En%20desarrollo-22C55E">
</p>

---

## Sobre el proyecto

**NumiLab** es una aplicacion web educativa creada para practicar metodos numericos enfocados en la busqueda de raices. La app permite ingresar una funcion, graficarla, elegir un metodo, observar las iteraciones y revisar el resultado final de forma visual.

Esta pensada para estudiantes que necesitan resolver ejercicios como biseccion, regla falsa, Newton-Raphson, secante, punto fijo, Muller y Bairstow, sin perder de vista el procedimiento matematico.

## Que puedes hacer

- Escribir funciones matematicas como `sin(x)`, `cos(x)`, `tan(x)`, `exp(x)`, `log(x)`, `sqrt(x)` y expresiones con potencias como `x^4 - 2*x^3`.
- Graficar la funcion de forma interactiva.
- Ver puntos ingresados directamente en la grafica.
- Detectar posibles raices en el rango seleccionado.
- Usar intervalos detectados para resolver mas rapido.
- Comparar el avance por iteraciones.
- Revisar error, convergencia y raiz aproximada.
- Guardar ejercicios en historial local.
- Exportar los resultados a Excel con tablas formateadas.
- Cambiar entre modo oscuro y modo claro.

## Metodos numericos incluidos

| Metodo | Datos iniciales | Ideal para |
| --- | --- | --- |
| Biseccion | `a`, `b` | Intervalos con cambio de signo |
| Regla falsa | `a`, `b` | Intervalos cerrados usando interpolacion |
| Punto fijo | `g(x)`, `x0` | Analizar convergencia de formulas |
| Newton-Raphson | `x0`, `f'(x)` | Convergencia rapida con buena estimacion inicial |
| Secante | `x0`, `x1` | Resolver sin derivada explicita |
| Muller | `x0`, `x1`, `x2` | Aproximaciones con parabola |
| Bairstow | Coeficientes, `r`, `s` | Polinomios y factores cuadraticos |

## Tecnologias utilizadas

- **React** para la interfaz.
- **TypeScript** para una base de codigo mas segura.
- **Vite** para desarrollo rapido.
- **Tailwind CSS** para estilos.
- **MathJS** para evaluar expresiones matematicas.
- **Plotly.js** para graficas interactivas.
- **xlsx-js-style** para exportar Excel con formato.
- **Lucide React** para iconos.

## Requisitos

Antes de ejecutar el proyecto, instala:

- [Node.js](https://nodejs.org/)
- npm
- Git

Puedes comprobarlo con:

```powershell
node -v
npm -v
git --version
```

## Instalacion

Clona el repositorio:

```powershell
git clone https://github.com/mary321mq/App_MNO-iteria-lab.git
```

Entra a la carpeta:

```powershell
cd "App_MNO-iteria-lab"
```

Instala las dependencias:

```powershell
npm install
```

## Ejecutar la app

Inicia el servidor de desarrollo:

```powershell
npm run dev
```

Luego abre en el navegador el enlace que aparezca en la terminal. Normalmente sera:

```text
http://127.0.0.1:5173/
```

Si ese puerto esta ocupado, Vite puede usar otro, por ejemplo:

```text
http://127.0.0.1:5174/
```

## Crear version de produccion

Para compilar el proyecto:

```powershell
npm run build
```

Si aparece una advertencia indicando que algunos archivos son grandes, normalmente se debe a **Plotly.js**, la libreria usada para las graficas. Esa advertencia no significa que la compilacion haya fallado.

Para revisar la version compilada:

```powershell
npm run preview
```

## Estructura del proyecto

```text
src/
|-- App.tsx
|   Pantalla principal, estados generales y flujo de la aplicacion.
|
|-- components/
|   |-- FunctionGraph.tsx
|   |   Grafica, puntos ingresados y raices detectadas.
|   |-- IterationTable.tsx
|   |   Tabla de iteraciones y acciones de exportacion.
|   `-- ResultCard.tsx
|       Resumen visual del resultado.
|
|-- methods/
|   Algoritmos numericos: biseccion, regla falsa, punto fijo,
|   Newton-Raphson, secante, Muller y Bairstow.
|
|-- math/
|   Parser de funciones, escaneo de intervalos, formato numerico
|   y utilidades matematicas.
|
|-- export/
|   Generacion de archivos Excel y copias de resultados.
|
`-- storage/
    Historial local guardado en el navegador.
```

## Como usar NumiLab

1. Ingresa una funcion en el campo `Ingrese f(x)`.
2. Ajusta el rango de la grafica si necesitas ver mejor los cruces.
3. Observa las raices detectadas y los puntos marcados.
4. Selecciona el metodo numerico.
5. Completa los datos iniciales que pide el metodo.
6. Configura la tolerancia y el maximo de iteraciones.
7. Presiona `Resolver`.
8. Revisa el resultado y la tabla de iteraciones.
9. Exporta a Excel si necesitas guardar o presentar el procedimiento.

## Exportacion a Excel

La app genera un archivo `.xlsx` con hojas organizadas:

- **Resumen:** datos principales del ejercicio y resultado final.
- **Iteraciones:** tabla con cada paso del metodo.
- **Configuracion:** parametros usados para resolver.

El archivo exportado incluye colores, bordes, encabezados centrados y formato numerico para que el reporte sea mas presentable.

## Estado del proyecto

Proyecto academico en desarrollo activo. Algunas mejoras futuras que se pueden agregar:

- Comparacion visual entre metodos.
- Mas ejemplos predefinidos.
- Explicaciones teoricas por cada algoritmo.
- Mejoras en reportes exportados.
- Nuevas animaciones y detalles visuales personalizados.

<p align="center">
  Hecho para estudiar raices numericas con estilo, claridad y paciencia.
</p>
