$(document).ready(function () {

    /*
     Konstanter og variabler som bare skal settes til en verdi når koden starter opp
     @ TID = bare en timer som viser hvor lenge en sakl vente før skriften sakte forsvinner
     @ FAKTISKSKRIVER = en timer som viser hvor leng en skal vise de andre hvor lenge en annen person skriver
     @ BRUKERNAVNFARGER = En samling med HEX farger som tilgies et brukernavn for å lettere diffransiere de forskjellige brukerene
     */
    var TID = 100;
    var FAKTISKSKRIVER = 500;
    var BRUKERNAVNFARGER = [
        '#fc0000', '#80ff00', '#0080ff', '#ffff00',
        '#fc007e', '#00ff00', '#ff8000', '#ff8000',
        '#fc7e00', '#00ff80', '#0000ff', '#80ff00'
    ];

    /*
     Variabler som brukes nedover i koden
     samt instansierer den(starter) selve grunnnsteinen for koden. Socket.io med socket = io();
     */
    var arrayMedMeldinger = $('.meldinger');
    var brukernavn;
    var brukerTilkoblet = false;
    var brukerSkriverNaa = false;
    var skrevSist;
    var socket = io(); //<-- denne greia
    var nyeMeldinger = 0;


    /*
     JQuery Magi som setter feltet der en skriver inn brukernavnet i fokus når du starter koden. Gjør det letter å komme igang ;)
     */
    $('.brukernavnInput').focus();

    /*
     Denne koden kjøres når det kommer en ny bruker Online.
     funksjonen tar inn data fra serveren, som viser antall brukere online
     For rettskrivingens sin skyld; er det en bruker online, viser den "det er 1 bruker online,
     hvis ikke, så skriver den det er X brukere online.
     */
    function meldingOmNyBruker(data) {
        var melding = '';
        if (data.antallBrukere === 1) {
            melding += "Det er 1 bruker online";
        } else {
            melding += "Det er " + data.antallBrukere + " brukere online";
        }
        systemLogg(melding);
    }

    /*
     Denne funksjonen setter brukernavet til "samtale" minnet som snakker med serveren
     For å sørge for at det ikke går ann å "ødelegge" serveren med kode, så har vi lagt inn funksjonen "fjernDivs"¨
     hvis(brukernavn) sjekker om det er satt et brukernavn, hvis det ikke er det, vil variabelen være tom og returnere False
     */
    function setBrukernavn() {
        brukernavn = rensDette($('.brukernavnInput').val().trim());
        if (brukernavn) {
            $('.login.side').hide();
            $('.chat.side').show();
            $('.login.side').off('click');
            $('.chatTekstFelt').focus();
            socket.emit('leggTilBruker', brukernavn);
        }
    }

    /*
     Denne funksjonen sender en melding ut til alle andre brukere (socket.emit)
     Den sjekker om brukeren er "tilkoblet" serveren, samt om det er satt en melding i tekstfeltet nederst i chatmenyen.
     Den sjekker også at meldingen ikke er "" blank. i så tilfelle vil den ikke sende ut blanke meldinger.
     */
    function sendMelding() {
        var melding = rensDette($('.chatTekstFelt').val());
        if (melding && brukerTilkoblet) {
            $('.chatTekstFelt').val('');
            nyChatMelding({
                brukernavn: brukernavn,
                melding: melding
            });
            socket.emit('ny melding', melding);
        }
    }

    /*
     Denne funksjonen gjør ikke annet enn å legge til tekst litt fancy på siden.
     Altså, ikke ny melding fra bruker, men ny melding fra serveren.
     */
    function systemLogg(melding, valg) {
        var element = $("<li>").addClass('logg').text(melding);
        leggTilMeldingselement(element, valg);
    }

    /*
     Denne funksjonen legger til en ny melding fra bruker til chatten.
     gjenbrukes også for å legge til at bruker X skriver.
     */
    function nyChatMelding(data, valg) {
        valg = valg || {};
        if (fjernBrukerSkriverMelding(data).length !== 0) {
            valg.fade = false;
            fjernBrukerSkriverMelding(data).remove();
        }
        var facyBrukernavnMedFarge = $('<span class="brukernavn"/>').text(data.brukernavn).css('color', faaFargeFraBrukernavn(data.brukernavn));
        var meldingFraBruker = $('<span class="meldingKropp">').text(data.melding);
        var skriver = data.skriver ? 'skriver' : '';
        var div = $('<li class="melding"/>').data('brukernavn', data.brukernavn).addClass(skriver).append(facyBrukernavnMedFarge, meldingFraBruker);
        leggTilMeldingselement(div, valg);
    }

    /*
     Legger til funksjonen "bruker x skriver" til chatvinduet
     */
    function brukerSkriver(data) {
        data.skriver = true;
        data.melding = 'skriver';
        nyChatMelding(data);
    }

    /*
     Etter en gitt tid, så gjrø denne funksjonen at meldingen "buker x skriver" fader fancy ut. (med jquery)
     */
    function fjernBrukerSkriver(data) {
        fjernBrukerSkriverMelding(data).fadeOut(function () {
            $(this).remove();
        });
    }

    /*
     Denne funksjonen brukes for å legge til et element i chatvinduet.
     Da det er ønskelig med "fade" på #bruker skriver, men ikke på meldinger som kommer inn fra brukere må vi først
     sjekke om det er noen "valg" med inn på koden. hvis det ikke er det setter vi valg til et tomt objekt (for å slippe feil)
     Er det dog ønskelig med valg(som fade out) så settes dette.
     prepend sørger for å sette inn verdien vi ønsker inn mellom de gitte HTLM tagsene vi ønsker. hvis ikke så dytter vi den inn nederst.
     scrollto sørger for at siden scroller av seg selv.
     */
    function leggTilMeldingselement(meldingsElement, valg) {
        var element = $(meldingsElement);

        if (valg = false) {
            valg = {};
        }
        if (typeof valg.fade === 'undefined') {
            valg.fade = true;
        }
        if (typeof valg.prepend === 'undefined') {
            valg.prepend = false;
        }
        if (valg.fade) {
            element.hide().fadeIn(TID);
        }
        if (valg.prepend) {
            arrayMedMeldinger.prepend(element);
        } else {
            arrayMedMeldinger.append(element);
        }
        console.log(arrayMedMeldinger[0].scrollTop);
        console.log(arrayMedMeldinger[0].scrollHeight);
        arrayMedMeldinger[0].scrollTop = arrayMedMeldinger[0].scrollHeight;
    }

    /*
     Denne hjelpefunksjonen sørger bare for at det ikke går ann å legge til "uønskede" strenger
     */
    function rensDette(inndata) {
        console.log("fjernDivs kjøres");
        return $("<div />").text(inndata).text();
    }

    /*
     Denne funksjonen kjøres for å notifisere de andre om at bruker X nå skriver noe i chatvinduet
     Etter en gitt timer uten aktivitet, notifiseres brukerene om at brukeren ikke lenger skriver.

     */
    function oppdaterOmBrukerSkriver() {
        if (brukerTilkoblet == true) {
            if (brukerSkriverNaa == false) {
                brukerSkriverNaa = true;
                socket.emit('skriver');
            }
            skrevSist = (new Date()).getTime();
            setTimeout(function () {
                var skriveTimer = (new Date()).getTime();
                var tidsdifferansen = skriveTimer - skrevSist;
                if (tidsdifferansen >= FAKTISKSKRIVER && brukerSkriverNaa) {
                    socket.emit('skriver ikke');
                    brukerSkriverNaa = false;
                }
            }, FAKTISKSKRIVER);
        }
    }

    /*
     Denne funskonen ser i alle medlinger om det er en medling som har med classetaggen "melding skriver"
     Så fremt den er dette, så finner den ut brukeravnet til personen som skriver.
     Den vil deretter ha mulighet til å søke opp hvikeln av brukerene som nå skal fades bort og forsvinne.
     Hvis vi bare valgte alle klasser som har melding skriver ville vi ha fjernet alle andre brukere samtidig.
     */
    function fjernBrukerSkriverMelding(data) {
        return $('.melding.skriver').filter(function (i) {
            return $(this).data('brukernavn') === data.brukernavn;
        });
    }

    /*
     For å gjøre chatten pen, har vi en funskjon som velger en farge ut ifra hva brukeren skriver inn som brukernavn.
     etter utregningen returnerer den kun indexen til BRUKERNAVNFARGER som da blir fargen til brukeren.
     */
    //I BROKE THIS - per kristian.
    function faaFargeFraBrukernavn(brukernavn) {
        var randomHashKode = 7;
        var lengdePaBrukernavn = brukernavn.length;
        for (var i = 0; i < lengdePaBrukernavn; i++) {
            randomHashKode = brukernavn.charCodeAt(i) + (randomHashKode << 5) - randomHashKode;
        }
        var index = Math.abs(randomHashKode % BRUKERNAVNFARGER.length);
        var returnertbrukernavn = "[" + BRUKERNAVNFARGER[index] + "]";
        return returnertbrukernavn;
    }


    /*
    Denne samler bare opp alt som skal kjøres før melding sendes til serveren.
    Den kjører funksjonen sendMelding (som henter verdien i tekstfeletet og sender dette)
    så sørger den for å si ifra at brukeren nå er ferdig med å skrive.
     */
    function sendMeldingTilServer(){
        sendMelding();
        socket.emit('skriver ikke');
        brukerSkriverNaa = false;
    }

    /*
     Denne funksjonen er laget for å håntere "send" knappen i koden.
     denne hører nå kun etter om det er en click event på knappen, hvis det er det, sender en trigger til sendMeldingTilServer()
     */
    $('.sendTekstButton').click(function () {
        sendMeldingTilServer()
    });

    /*
     Denne funksjonen leser input som skrives på tastaturet. Så fremt en ikke trykker enter, så registerer den at
     brukeren holder på å skrive. Trykker en enter (13) så sier den i fra til serveren at det ikke lenger er nødvendig å skrive.
     */
    $(window).keydown(function (event) {
        if (!(event.ctrlKey || event.metaKey || event.altKey)) {
            $('.chatTekstFelt').focus();
        }
        if (event.which === 13) {
            if (brukernavn) {
                sendMeldingTilServer()
            } else {
                setBrukernavn();
            }
        }
    });

    /*
     Denne funksjonen endrer tittelfeltet øverst på siden dynamisk ut ifra om det har kommet inn nye meldinger
     Den sjekker om $(window) som i hovedsak er nettleservinduet har fokus, eller om fokus blir fjernet fra vinduet.
     His den får fokus setter den antall nye meldinger til 0, samt setter tittelen til "nettchat" igjen.
     Så fremt så fremt den ikke har fokus legger den til variablenen nyeMeldinger.
     på alle event som har 'ny melding' som kommer fra serveren, inkrementerer denne med 1
     */
    $(window).on("blur focus", function (tilstand) {
        var tilstandsType = $(this).data("tilstand");
        if (tilstandsType != tilstand.type) {
            switch (tilstand.type) {
                case "blur":
                    $(document).attr("title", "NettChat (" + nyeMeldinger + ")");
                    break;
                case "focus":
                    nyeMeldinger = 0;
                    $(document).attr("title", "NettChat ");
                    break;
            }
        }
    });

    /*
     Om en skriver inn på inputfeltet, så sender denne en event som sier at Brukeren skriver
     */
    $('.chatTekstFelt').on('input', function () {
        oppdaterOmBrukerSkriver();
    });

    /*
     En hjelpefunksjon som har av det eneste formålet å sette fokuset på inndatafeletet til brukernavnet hvis
     en trykker på random sted på home.
     */
    $('.login.side').click(function () {
        $('.brukernavnInput').focus();
    });

    /*
     Samme funksjon som ovenfor, bare at det gjelder chatvinduet istedet.
     */
    $('.chat.side').click(function () {
        $('.chatTekstFelt').focus();
    });


    /*
     Hvis brukeren har skrevet seg et brukernavn trigges denne for å sekive Velkommer til siden.
     */
    socket.on('logget in', function (data) {
        brukerTilkoblet = true;
        var message = "Velkommen til prosjekgruppeChatten";
        systemLogg(message, {prepend: true});
        meldingOmNyBruker(data);
    });

    /*
     Denne hører etter om det kommer en ny melding, Om det kommer ny melding kjører den funksjonen
     nyChatMelding()
     Siden blir også oppdatert med antall nye meldinger som har komemt inn siden sist, så frem vidnuet ikke har fokus.
     */
    socket.on('ny melding', function (data) {
        nyeMeldinger++;
        $(document).attr("title", "NettChat (" + nyeMeldinger + ")");
        nyChatMelding(data);
    });

    /*
     Denne funksjonen hører etter om det kobles til en ny bruker. Hvis det gjøres skrives dette til chatten slik at alle
     brukere ser dette.
     */
    socket.on('bruker tilkoblet', function (data) {
        systemLogg(data.brukernavn + ' Ble med i chatten');
        meldingOmNyBruker(data);
    });

    /*
     Denne hører etter om en bruker lukker/laster siden på nytt o.l. som medfører en "bruker frakoblet event.
     Hvis i så tilfelle skrives dette til chatten.
     Bruker skriver ikke er med for å sørge for at det ikke låser seg i catten til andre at denne brukeren ikke
     lenger "skriver" om han gjore dette når han logget av.
     */
    socket.on('bruker frakoblet', function (data) {
        systemLogg(data.brukernavn + ' forlot kanalen');
        meldingOmNyBruker(data);
        fjernBrukerSkriver(data);
    });

    /*
     Denne sjekker om andre brukere skriver, hvis de gjør, så skrives det til loggen at bruker x skriver.
     */
    socket.on('skriver', function (data) {
        brukerSkriver(data);
    });

    /*
     Denne hører etter om brukeren som skrev, sluttet å skrive.
     */
    socket.on('skriver ikke', function (data) {
        fjernBrukerSkriver(data);
    });
});
