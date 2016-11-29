/*
NODE EXPRESS SERVER WITH SOCKETIO
 */

var express = require('express');
var app = express();

var port = process.env.PORT || 3000;
var server = require('http').createServer(app);

var io = require('socket.io')(server);

var brukereOnline = 0;

server.listen(port, function () {
    console.log('Serveren har åpnet på: %d', port);
});


app.use(express.static(__dirname + '/public'));

io.on('connection', function (samtale) {
    var validUser = false;

    samtale.on('leggTilBruker', function (brukernavn) {
        //if true(return), aka do nothing
        console.log("forsøker å legge til bruker");
        if (validUser) return;
        samtale.brukernavn = brukernavn;
        brukereOnline++;
        validUser = true;
        console.log("brukeren logget på: "+ brukernavn);
        samtale.emit('logget in', {antallBrukere: brukereOnline});
        console.log("brukeren logget inn og fått tilbake antall online brukere, forteller resten at han har joinet!");
        samtale.broadcast.emit('bruker tilkoblet', {brukernavn: samtale.brukernavn, antallBrukere: brukereOnline});
        console.log("alle har fått beskjed")
    });

    samtale.on('ny melding', function (melding) {
        console.log(melding);
        samtale.broadcast.emit('ny melding', {brukernavn: samtale.brukernavn, melding: melding});
    });


    samtale.on('skriver', function () {
        console.log(samtale.brukernavn + "skriver noe")
        samtale.broadcast.emit('skriver', {brukernavn: samtale.brukernavn});
    });

    samtale.on('skriver ikke', function () {
        console.log(samtale.brukernavn + "skriver ikke lenger")
        samtale.broadcast.emit('skriver ikke', {brukernavn: samtale.brukernavn});
    });

    /*
    så en liten opprydding om en bruker quitter, eller mister nettet.
    socket ser at tilkoblingen brytes, og den fjerer da brukeren så fremt validUser tilstede.
    så fjernes 1 fra antallet slik at antall online brukere stemmer.
    etter dette er gjort, pushes så en 'user left' til alle brukere, sammen med brukeravnet som forsvant, sammen med antall online brukere.
     */

    samtale.on('disconnect', function () {
        if (validUser) {
            brukereOnline--;
            samtale.broadcast.emit('bruker frakoblet', {brukernavn: samtale.brukernavn, antallBrukere: brukereOnline });
        }
    });
});

/*
thats it folks, easy peasy.
 */