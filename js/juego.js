"use strict";

/* Referencias a la interfaz. */
const $ = id => document.getElementById(id);
const menu = $("escena-menu"), juego = $("escena-juego"), rutasSvg = $("capa-rutas");
const destinos = $("capa-destinos"), oruga = $("oruga"), preguntaEl = $("pregunta");
const respuestasEl = $("respuestas"), mensaje = $("mensaje"), progreso = $("progreso"), marcador = $("marcador");
const modal = $("modal"), modalTitulo = $("modal-titulo"), modalTexto = $("modal-texto");

/* Banco editable. No hay campos de texto: todas las respuestas son botones. */
const preguntas = [
 {enunciado:"¿Qué tipo de agricultura aplica CityHuertas?",opciones:["Orgánica","Industrial sostenible","Agroecología"],correcta:"Agroecología"},
 {enunciado:"Verdadero o falso: Producción de Kilómetro cero significa que los productos se siembran en el sitio de consumo .",opciones:["Verdadero","Falso"],correcta:"Falso"},
 {enunciado:"¿Cual es nombre de la Oruga?",opciones:["Feijoa","Fito","Fruto"],correcta:"Fito"},
 {enunciado:"Verdadero o falso: todas las orugas permanecen orugas toda su vida.",opciones:["Verdadero","Falso"],correcta:"Falso"},
 {enunciado:"¿En qué se transforma normalmente una oruga?",opciones:["Mariposa o polilla","Hormiga","Araña"],correcta:"Mariposa o polilla"}
];

/* Árbol real de decisiones. Cada nodo tiene posición, pregunta y dos destinos.
   Si el jugador falla, se cierra una rama. Si acierta, puede elegir cualquiera. */
const mapaBase = {
 inicio:{x:20,y:93,p:0,rutas:[{a:"centro2",x:28,y:70},{a:"izq1",x:20,y:80},{a:"der1",x:37,y:80}]},
 izq1:{x:20,y:80,p:1,rutas:[{a:"centro2",x:28,y:70},{a:"der1",x:37,y:80}]},
 der1:{x:37,y:80,p:2,rutas:[{a:"centro2",x:28,y:70},{a:"izq1",x:20,y:80}]},
 centro2:{x:28,y:70,p:3,rutas:[{a:"centro3",x:28,y:60},{a:"izq2",x:20,y:60},{a:"der2",x:37,y:60}]},
 izq2:{x:20,y:60,p:4,rutas:[{a:"centro3",x:28,y:50},{a:"der2",x:37,y:60}]},
 der2:{x:37,y:60,p:2,rutas:[{a:"centro3",x:28,y:50},{a:"izq2",x:20,y:60}]},
 centro3:{x:28,y:50,p:3,rutas:[{a:"copa3",x:28,y:25},{a:"der3",x:37,y:40},{a:"izq3",x:20,y:40}]},
 izq3:{x:20,y:40,p:3,rutas:[{a:"copa3",x:28,y:25},{a:"der2",x:37,y:60}]},
 der3:{x:37,y:40,p:3,rutas:[{a:"copa3",x:28,y:25},{a:"centro3",x:28,y:50}]},
 copa3:{x:28,y:25,p:4,rutas:[{a:"der3",x:28,y:40},{a:"final",x:28,y:20}]},
 final:{x:28,y:20,p:null,rutas:[]}
};
let mapa, nodoActual="inicio", nivel=0, aciertos=0, bloqueado=false;

$("btn-iniciar").addEventListener("click", iniciar);
$("btn-menu").addEventListener("click", mostrarMenu);
$("btn-instrucciones").addEventListener("click",()=>abrirModal("Instrucciones",`<ol><li>Lee la pregunta o afirmación.</li><li>Haz clic en una respuesta.</li><li>Si aciertas, elige una de las dos ramas doradas.</li><li>Si fallas, una rama se cierra y debes usar la alternativa.</li><li>Llega hasta la copa. El juego se controla solo con mouse o pantalla táctil.</li></ol>`));
$("btn-creditos").addEventListener("click",()=>abrirModal("Créditos",`<p><strong>Diseño y programación:</strong> Jose Manuel Chauta, Juan Sebastian Colón, Hary Sierra</p><p><strong>Institución:</strong> Politécnico Grancolombiano</p><p>Base educativa desarrollada con HTML5, CSS y JavaScript.</p>`));
$("btn-cerrar-modal").addEventListener("click",cerrarModal);
modal.addEventListener("click",e=>{if(e.target===modal)cerrarModal()});

function iniciar(){
  mapa=structuredClone(mapaBase); nodoActual="inicio"; nivel=0; aciertos=0; bloqueado=false;
  rutasSvg.innerHTML=""; destinos.innerHTML=""; dibujarMapa(); moverSinAnimar(mapa.inicio.x,mapa.inicio.y);
  menu.classList.add("oculta"); juego.classList.remove("oculta"); cargarPregunta();
}
function mostrarMenu(){juego.classList.add("oculta");menu.classList.remove("oculta")}
function cargarPregunta(){
  bloqueado=false; destinos.innerHTML=""; const nodo=mapa[nodoActual], p=preguntas[nodo.p];
  preguntaEl.textContent=p.enunciado; respuestasEl.innerHTML=""; mensaje.textContent="Selecciona una respuesta con el mouse."; mensaje.className="mensaje";
  progreso.textContent=`Nivel ${nivel+1} de ${preguntas.length}`; marcador.textContent=`Aciertos: ${aciertos}`;
  p.opciones.forEach(op=>{const b=document.createElement("button");b.type="button";b.className="respuesta";b.textContent=op;b.addEventListener("click",()=>evaluar(op,p));respuestasEl.appendChild(b)});
}
function evaluar(op,p){
  if(bloqueado)return; bloqueado=true; respuestasEl.querySelectorAll("button").forEach(b=>b.disabled=true);
  const nodo=mapa[nodoActual];
  if(op===p.correcta){aciertos++;marcador.textContent=`Aciertos: ${aciertos}`;mensaje.textContent="¡Correcto! Elige la rama por la que quieres subir.";mensaje.className="mensaje correcto";nodo.rutas.forEach(crearDestino)}
  else{const cerrada=nodo.rutas.find(r=>!r.cerrada);cerrada.cerrada=true;document.getElementById(cerrada.linea)?.classList.add("rama-cerrada");mensaje.textContent="Respuesta incorrecta. Esa rama se cerró; continúa por la alternativa.";mensaje.className="mensaje error";const alternativa=nodo.rutas.find(r=>!r.cerrada);if(alternativa)crearDestino(alternativa)}
}
function crearDestino(r){
  const b=document.createElement("button");b.type="button";b.className="destino";b.style.left=`${r.x}%`;b.style.top=`${r.y}%`;b.setAttribute("aria-label","Subir por esta rama");b.addEventListener("click",()=>avanzar(r));destinos.appendChild(b);
}
function avanzar(r){
  destinos.innerHTML="";oruga.style.left=`${r.x}%`;oruga.style.top=`${r.y}%`;
  setTimeout(()=>{nodoActual=r.a;nivel++;if(nodoActual==="final"||mapa[nodoActual].p===null)finalizar();else cargarPregunta()},680);
}
function dibujarMapa(){
  const vistos=new Set(); Object.entries(mapa).forEach(([id,n])=>n.rutas.forEach((r,i)=>{const clave=`${id}-${i}`;if(vistos.has(clave))return;vistos.add(clave);const l=document.createElementNS("http://www.w3.org/2000/svg","line");l.setAttribute("x1",n.x*10);l.setAttribute("y1",n.y*7);l.setAttribute("x2",r.x*10);l.setAttribute("y2",r.y*7);l.setAttribute("class","rama");r.linea=`linea-${id}-${i}`;l.id=r.linea;rutasSvg.appendChild(l)}));
}
function moverSinAnimar(x,y){oruga.style.transition="none";oruga.style.left=`${x}%`;oruga.style.top=`${y}%`;requestAnimationFrame(()=>requestAnimationFrame(()=>oruga.style.transition=""))}
function finalizar(){
  preguntaEl.textContent="¡Felicitaciones, Llegaste a la Feijoa!";mensaje.textContent=`Llevaste a Fito en ${aciertos} aciertos de ${preguntas.length}.`;mensaje.className="mensaje correcto";progreso.textContent="Recorrido completado";respuestasEl.innerHTML="";
  [["Jugar de nuevo",iniciar],["Menú principal",mostrarMenu]].forEach(([t,f])=>{const b=document.createElement("button");b.type="button";b.className="respuesta";b.textContent=t;b.addEventListener("click",f);respuestasEl.appendChild(b)});
}
function abrirModal(t,h){modalTitulo.textContent=t;modalTexto.innerHTML=h;modal.classList.remove("oculta");$("btn-cerrar-modal").focus()}
function cerrarModal(){modal.classList.add("oculta")}
