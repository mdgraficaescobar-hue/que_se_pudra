const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Enrutamiento limpio
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'splash.html'));
});

app.get('/lobby', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'lobby.html'));
});

// ==========================================================
// ESTADO GLOBAL DEL JUEGO
// ==========================================================
let estado = {
    fase: "LOBBY",             // LOBBY, APOSTANDO, JUGANDO, MOSTRANDO_RESULTADO, FIN_JUEGO
    rondaActual: 1,
    cartasEnEstaRonda: 1,
    turnoDe: null,
    ganadorFinal: null,
    anuncioManoGanada: null,   
    jugadores: [],
    mesa: []                  
};

// Configuración de cartas de Poker Tradicional
const PALOS = [
    { text: '♥', color: 'rojo' }, // Corazones
    { text: '♦', color: 'rojo' }, // Diamantes
    { text: '♠', color: 'negro' }, // Picas
    { text: '♣', color: 'negro' }  // Tréboles
];
// Jerarquía de poder de mayor a menor (As es la más alta, 2 la más baja)
const VALORES_PODER = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']; 

function generarMazo() {
    let mazo = [];
    PALOS.forEach(palo => {
        VALORES_PODER.forEach(valor => {
            mazo.push({ numero: valor, palo: palo.text, color: palo.color });
        });
    });
    return mazo.sort(() => Math.random() - 0.5);
}

function calcularCartasPorRonda(ronda) {
    if (ronda <= 5) return ronda; 
    return 11 - ronda; // Baja progresivamente hasta la ronda 10
}

function evaluarGanadorDeMano(cartasEnMesa) {
    if (cartasEnMesa.length === 0) return null;
    let mejorItem = cartasEnMesa[0];
    
    for (let i = 1; i < cartasEnMesa.length; i++) {
        let poderClave = VALORES_PODER.indexOf(mejorItem.carta.numero);
        let poderRetador = VALORES_PODER.indexOf(cartasEnMesa[i].carta.numero);
        
        // El que tenga menor índice en VALORES_PODER es más fuerte ('A' es 0)
        if (poderRetador < poderClave) {
            mejorItem = cartasEnMesa[i];
        }
    }
    return mejorItem.jugador;
}

function avanzarTurno(nombreActual) {
    const idx = estado.jugadores.findIndex(j => j.nombre === nombreActual);
    const siguienteIdx = (idx + 1) % estado.jugadores.length;
    return estado.jugadores[siguienteIdx].nombre;
}

function procesarBotsApostando() {
    estado.jugadores.forEach(j => {
        if (j.esBot && j.apuesta === null) {
            j.apuesta = Math.floor(Math.random() * (estado.cartasEnEstaRonda + 1));
        }
    });

    const faltanApuestas = estado.jugadores.some(j => j.apuesta === null);
    if (!faltanApuestas) {
        estado.fase = "JUGANDO";
        procesarTurnoBot();
    }
}

function procesarTurnoBot() {
    if (estado.fase !== "JUGANDO") return;

    let jugadorActual = estado.jugadores.find(j => j.nombre === estado.turnoDe);
    if (jugadorActual && jugadorActual.esBot) {
        setTimeout(() => {
            if (jugadorActual.cartas && jugadorActual.cartas.length > 0) {
                let cartaParaTirar = jugadorActual.cartas.shift();
                estado.mesa.push({ jugador: jugadorActual.nombre, carta: cartaParaTirar });
                evaluarFlujoDeCartas();
            }
        }, 1000);
    }
}

function evaluarFlujoDeCartas() {
    if (estado.mesa.length === estado.jugadores.length) {
        estado.fase = "MOSTRANDO_RESULTADO"; 
        
        let ganadorDeMano = evaluarGanadorDeMano(estado.mesa);
        const jGanador = estado.jugadores.find(j => j.nombre === ganadorDeMano);
        if (jGanador) jGanador.manosGanadas += 1;

        estado.anuncioManoGanada = `¡Ganador de la mano: ${ganadorDeMano}! 🏆`;
        io.emit('actualizar_estado', estado);

        // DELAY CRUCIAL: 3 segundos fijos para que todos vean la última carta
        setTimeout(() => {
            estado.anuncioManoGanada = null;
            estado.mesa = []; 

            let cartasRestantes = estado.jugadores[0].cartas.length;

            if (cartasRestantes === 0) {
                // FIN DE RONDA -> Calcular puntos
                estado.jugadores.forEach(j => {
                    if (j.apuesta === j.manosGanadas) {
                        j.puntosTotales += 10 + (j.manosGanadas * 3);
                    } else {
                        let diferencia = Math.abs(j.apuesta - j.manosGanadas);
                        j.puntosTotales -= (diferencia * 3);
                    }
                });

                if (estado.rondaActual >= 10) {
                    estado.fase = "FIN_JUEGO";
                    let mejorJugador = estado.jugadores.reduce((max, j) => j.puntosTotales > max.puntosTotales ? j : max, estado.jugadores[0]);
                    estado.ganadorFinal = mejorJugador.nombre;
                } else {
                    estado.rondaActual += 1;
                    prepararNuevaRonda();
                }
            } else {
                estado.fase = "JUGANDO";
                estado.turnoDe = ganadorDeMano;
                procesarTurnoBot();
            }
            io.emit('actualizar_estado', estado);
        }, 3000);

    } else {
        estado.turnoDe = avanzarTurno(estado.turnoDe);
        io.emit('actualizar_estado', estado);
        procesarTurnoBot();
    }
}

function prepararNuevaRonda() {
    estado.fase = "APOSTANDO";
    estado.cartasEnEstaRonda = calcularCartasPorRonda(estado.rondaActual);
    estado.mesa = [];
    
    let mazo = generarMazo();
    
    estado.jugadores.forEach(j => {
        j.apuesta = null;
        j.manosGanadas = 0;
        j.cartas = [];
        for (let i = 0; i < estado.cartasEnEstaRonda; i++) {
            j.cartas.push(mazo.pop());
        }
    });

    estado.turnoDe = estado.jugadores[(estado.rondaActual - 1) % estado.jugadores.length].nombre;
    
    setTimeout(() => {
        procesarBotsApostando();
        io.emit('actualizar_estado', estado);
    }, 500);
}

// ==========================================================
// SOCKETS
// ==========================================================
io.on('connection', (socket) => {
    socket.emit('actualizar_estado', estado);

    socket.on('unirse_mesa', (datos) => {
        let existente = estado.jugadores.find(j => j.nombre === datos.nombre);
        if (!existente && estado.fase === "LOBBY") {
            estado.jugadores.push({
                id: socket.id,
                nombre: datos.nombre,
                colorFicha: datos.colorFicha || "azul",
                puntosTotales: 0,
                manosGanadas: 0,
                apuesta: null,
                cartas: [],
                esBot: false
            });
        } else if (existente) {
            existente.id = socket.id;
        }
        io.emit('actualizar_estado', estado);
    });

    socket.on('iniciar_partida', () => {
        if (estado.fase !== "LOBBY") return;
        let contadorBot = 1;
        while (estado.jugadores.length < 4) {
            estado.jugadores.push({
                id: `bot_${contadorBot}`,
                nombre: `Bot Inteligente ${contadorBot}`,
                colorFicha: ["roja", "verde", "naranja", "violeta"][contadorBot - 1],
                puntosTotales: 0,
                manosGanadas: 0,
                apuesta: null,
                cartas: [],
                esBot: true
            });
            contadorBot++;
        }
        estado.rondaActual = 1;
        prepararNuevaRonda();
    });

    socket.on('enviar_apuesta', (cantidad) => {
        let jugador = estado.jugadores.find(j => j.id === socket.id);
        if (jugador && estado.fase === "APOSTANDO" && jugador.apuesta === null) {
            jugador.apuesta = cantidad;
            procesarBotsApostando();
            io.emit('actualizar_estado', estado);
        }
    });

    socket.on('enviar_carta', (cartaCliente) => {
        let jugador = estado.jugadores.find(j => j.id === socket.id);
        if (jugador && estado.fase === "JUGANDO" && estado.turnoDe === jugador.nombre) {
            jugador.cartas = jugador.cartas.filter(c => !(c.numero === cartaCliente.numero && c.palo === cartaCliente.palo));
            estado.mesa.push({ jugador: jugador.nombre, carta: cartaCliente });
            evaluarFlujoDeCartas();
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor listo en http://localhost:${PORT}`);
});