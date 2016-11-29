/*
NODE EXPRESS SERVER WITH SOCKETIO
 */

var express = require('express');                   //laster inn express rammeverket til variabellent express
var app = express();                                //lager en instans av express server til variabelen app (webserveren)

var port = process.env.PORT || 3000;                //setter portnummeret
var server = require('http').createServer(app);     // starter en server, over Http, som bruker express rammeverket over

var io = require('socket.io')(server);              // instasierer socket.io rammeverket på vår server laget ovenfor

var brukereOnline = 0;                              // variablel som lagrer brukere online


/*
Her starter vi serveren. etter serveren er startet logger vi at serveren er startet og portnummeret.
 */
server.listen(port, function () {
    console.log('Serveren har åpnet på: %d', port);
});

app.use(express.static(__dirname + '/public'));     // For å få tilgang til undermappen public, (Der frontGUIet ligger) så trenger vi tilgang /public mappa

/*
en 'connection' event blir sendt fra brukeren så fort de har lastet siden,
dette setter basisen for en socket.io samtale
 */
io.on('connection', function (samtale) {
    var erSamtaleBrukernavnSatt = false;                          // sjekker om brukeren har logget på.


    /*
    en 'leggTilBruker' event setter samtales brukernavn til hva som ble skrevet inn på brukernavnet før en komemer til chat'en
    Den trigger en:
    'logget in' : Som returnerer antall brukere som er tilkoblet serveren.
    'bruker tilkoblet' : Som forteller alle andre brukere at en ny person nå er med i samtalen.
     */
    samtale.on('leggTilBruker', function (brukernavn) {
        if (erSamtaleBrukernavnSatt) return;
        samtale.brukernavn = brukernavn;
        brukereOnline++;
        erSamtaleBrukernavnSatt = true;
        samtale.emit('logget in', {antallBrukere: brukereOnline});
        samtale.broadcast.emit('bruker tilkoblet', {brukernavn: samtale.brukernavn, antallBrukere: brukereOnline});
    });

    /*
    Denne funksjonen tar inn meldingen fra brukeren, og videresender den til Alle brukere, sammen med brukernavnet som sendte meldingen
     */
    samtale.on('ny melding', function (melding) {
        samtale.broadcast.emit('ny melding', {brukernavn: samtale.brukernavn, melding: melding});
    });

    /*
    Om en bruker skriver noe på tastauret eller ligenden sendes det en 'skriver' event.
    Denne funksjonen videresender dette til alle brukere, sammen med brukernavnet som skriver.
     */
    samtale.on('skriver', function () {
        samtale.broadcast.emit('skriver', {brukernavn: samtale.brukernavn});
    });

    /*
    Denn funksjonen tar imot om brukeren har sluttet å skrive, for å si ifra dette til alle andre brukere.
    Dette for at de andre brukerene skal få fjernet "bruker x skriver"
     */
    samtale.on('skriver ikke', function () {
        samtale.broadcast.emit('skriver ikke', {brukernavn: samtale.brukernavn});
    });

    /*
    så en liten opprydding om en bruker quitter, eller mister nettet.
    socket ser at tilkoblingen brytes, og den fjerer da brukeren så fremt et brukernavn er satt til samtalen.
    så fjernes 1 fra antallet slik at antall online brukere stemmer.
    etter dette er gjort, pushes så en 'bruker frakoblet' til alle brukere, sammen med brukeravnet som forsvant, sammen med antall online brukere.
     */
    samtale.on('disconnect', function () {
        if (erSamtaleBrukernavnSatt) {
            brukereOnline--;
            samtale.broadcast.emit('bruker frakoblet', {brukernavn: samtale.brukernavn, antallBrukere: brukereOnline });
        }
    });
});

/*
thats it folks, easy peasy.
 */