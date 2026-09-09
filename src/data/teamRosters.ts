/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TeamRosterProfile {
  manager: string;
  formation: string;
  startingXI: string[];
  bench: string[];
  absences: {
    player: string;
    position: string;
    reason: string;
    status: 'OUT' | 'DOUBTFUL' | 'QUESTIONABLE';
    impactLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
  tacticalNotes: string;
}

export const KNOWN_TEAM_ROSTERS: Record<string, TeamRosterProfile> = {
  'Arsenal': {
    manager: 'Mikel Arteta',
    formation: '4-3-3',
    startingXI: [
      'David Raya (GK)',
      'Jurrien Timber (RB)',
      'William Saliba (CB)',
      'Gabriel Magalhães (CB)',
      'Riccardo Calafiori (LB)',
      'Thomas Partey (DM)',
      'Declan Rice (CM)',
      'Martin Ødegaard (AM)',
      'Bukayo Saka (RW)',
      'Gabriel Martinelli (LW)',
      'Kai Havertz (CF)'
    ],
    bench: ['Neto (GK)', 'Ben White (DEF)', 'Oleksandr Zinchenko (DEF)', 'Jakub Kiwior (DEF)', 'Jorginho (MID)', 'Mikel Merino (MID)', 'Ethan Nwaneri (MID)', 'Raheem Sterling (FWD)', 'Leandro Trossard (FWD)', 'Gabriel Jesus (FWD)'],
    absences: [
      {
        player: 'Takehiro Tomiyasu',
        position: 'RB/CB',
        reason: 'Knee injury rehabilitation',
        status: 'OUT',
        impactLevel: 'MEDIUM'
      },
      {
        player: 'Kieran Tierney',
        position: 'LB',
        reason: 'Hamstring muscle recovery',
        status: 'OUT',
        impactLevel: 'LOW'
      }
    ],
    tacticalNotes: 'Fluid 4-3-3 shape with high counter-pressing, inverted full-backs, and Ødegaard orchestrating central chance creation.'
  },
  'Coventry City': {
    manager: 'Mark Robins',
    formation: '4-2-3-1',
    startingXI: [
      'Oliver Dovin (GK)',
      'Milan van Ewijk (RB)',
      'Bobby Thomas (CB)',
      'Liam Kitching (CB)',
      'Jay Dasilva (LB)',
      'Ben Sheaf (DM)',
      'Josh Eccles (CM)',
      'Tatsuhiro Sakamoto (RW)',
      'Jack Rudoni (AM)',
      'Haji Wright (LW)',
      'Ellis Simms (CF)'
    ],
    bench: ['Ben Wilson (GK)', 'Joel Latibeaudiere (DEF)', 'Luis Binks (DEF)', 'Victor Torp (MID)', 'Jamie Allen (MID)', 'Ephron Mason-Clark (FWD)', 'Norman Bassette (FWD)'],
    absences: [
      {
        player: 'Raphael Borges Rodrigues',
        position: 'RW',
        reason: 'Leg fracture rehabilitation',
        status: 'OUT',
        impactLevel: 'MEDIUM'
      },
      {
        player: 'Jake Bidwell',
        position: 'LB',
        reason: 'Knock sustained in training',
        status: 'DOUBTFUL',
        impactLevel: 'LOW'
      }
    ],
    tacticalNotes: 'Compact low-block 4-2-3-1 transitioning quickly down the flanks through Van Ewijk and Haji Wright.'
  },
  'Bayern Munich': {
    manager: 'Vincent Kompany',
    formation: '4-2-3-1',
    startingXI: [
      'Manuel Neuer (GK)',
      'Joshua Kimmich (RB)',
      'Dayot Upamecano (CB)',
      'Kim Min-jae (CB)',
      'Alphonso Davies (LB)',
      'Aleksandar Pavlović (DM)',
      'João Palhinha (CM)',
      'Michael Olise (RW)',
      'Jamal Musiala (AM)',
      'Serge Gnabry (LW)',
      'Harry Kane (CF)'
    ],
    bench: ['Sven Ulreich (GK)', 'Eric Dier (DEF)', 'Raphaël Guerreiro (DEF)', 'Leon Goretzka (MID)', 'Konrad Laimer (MID)', 'Kingsley Coman (FWD)', 'Leroy Sané (FWD)', 'Thomas Müller (FWD)', 'Mathys Tel (FWD)'],
    absences: [
      {
        player: 'Hiroki Ito',
        position: 'CB',
        reason: 'Metatarsal foot fracture recovery',
        status: 'OUT',
        impactLevel: 'HIGH'
      },
      {
        player: 'Josip Stanišić',
        position: 'RB/CB',
        reason: 'Right knee collateral ligament tear',
        status: 'OUT',
        impactLevel: 'HIGH'
      },
      {
        player: 'Sacha Boey',
        position: 'RB',
        reason: 'Meniscus injury recovery',
        status: 'OUT',
        impactLevel: 'MEDIUM'
      }
    ],
    tacticalNotes: 'High defensive line with rapid counter-pressing and Harry Kane dropping into midfield pockets to release Olise and Musiala.'
  },
  'SSV Ulm': {
    manager: 'Thomas Wörle',
    formation: '3-4-2-1',
    startingXI: [
      'Christian Ortag (GK)',
      'Johannes Reichert (CB)',
      'Philipp Strompf (CB)',
      'Tom Gaal (CB)',
      'Bastian Allgeier (RWB)',
      'Max Brandt (CM)',
      'Philipp Maier (CM)',
      'Romario Rösch (LWB)',
      'Maurice Krattenmacher (AM)',
      'Dennis Chessa (AM)',
      'Felix Higl (CF)'
    ],
    bench: ['Marvin Seybold (GK)', 'Niklas Kolbe (DEF)', 'Lennart Stoll (DEF)', 'Lukas Schmitz (MID)', 'Julian Kudala (MID)', 'Aaron Keller (FWD)', 'Semir Telalović (FWD)'],
    absences: [
      {
        player: 'Lucas Röser',
        position: 'CF',
        reason: 'Cruciate ligament surgery rehabilitation',
        status: 'OUT',
        impactLevel: 'HIGH'
      },
      {
        player: 'Christian Ortag',
        position: 'GK',
        reason: 'Concussion protocol check',
        status: 'QUESTIONABLE',
        impactLevel: 'MEDIUM'
      }
    ],
    tacticalNotes: 'Structured 5-man defensive shape looking to deny central access and capitalize on set-piece deliveries.'
  },
  'Manchester City': {
    manager: 'Pep Guardiola',
    formation: '4-3-3',
    startingXI: [
      'Ederson (GK)',
      'Rico Lewis (RB)',
      'Manuel Akanji (CB)',
      'Rúben Dias (CB)',
      'Joško Gvardiol (LB)',
      'Mateo Kovačić (DM)',
      'Bernardo Silva (CM)',
      'Kevin De Bruyne (AM)',
      'Phil Foden (RW)',
      'Savinho (LW)',
      'Erling Haaland (CF)'
    ],
    bench: ['Stefan Ortega (GK)', 'Kyle Walker (DEF)', 'John Stones (DEF)', 'Nathan Aké (DEF)', 'İlkay Gündoğan (MID)', 'Matheus Nunes (MID)', 'Jack Grealish (FWD)', 'Jeremy Doku (FWD)'],
    absences: [
      {
        player: 'Rodri',
        position: 'DM',
        reason: 'Anterior cruciate ligament (ACL) knee surgery',
        status: 'OUT',
        impactLevel: 'HIGH'
      },
      {
        player: 'Oscar Bobb',
        position: 'RW',
        reason: 'Fractured bone in leg recovery',
        status: 'OUT',
        impactLevel: 'MEDIUM'
      }
    ],
    tacticalNotes: 'Positional overload system with Gvardiol pushing high and Haaland finishing crosses in the six-yard box.'
  },
  'Real Madrid': {
    manager: 'Carlo Ancelotti',
    formation: '4-3-3',
    startingXI: [
      'Thibaut Courtois (GK)',
      'Lucas Vázquez (RB)',
      'Éder Militão (CB)',
      'Antonio Rüdiger (CB)',
      'Ferland Mendy (LB)',
      'Aurélien Tchouaméni (DM)',
      'Federico Valverde (CM)',
      'Jude Bellingham (AM)',
      'Rodrygo (RW)',
      'Kylian Mbappé (CF)',
      'Vinícius Júnior (LW)'
    ],
    bench: ['Andriy Lunin (GK)', 'Fran García (DEF)', 'Jesús Vallejo (DEF)', 'Luka Modrić (MID)', 'Eduardo Camavinga (MID)', 'Dani Ceballos (MID)', 'Arda Güler (MID)', 'Brahim Díaz (FWD)', 'Endrick (FWD)'],
    absences: [
      {
        player: 'Dani Carvajal',
        position: 'RB',
        reason: 'Cruciate ligament (ACL) knee surgery recovery',
        status: 'OUT',
        impactLevel: 'HIGH'
      },
      {
        player: 'David Alaba',
        position: 'CB',
        reason: 'Knee ligament recovery phase',
        status: 'OUT',
        impactLevel: 'HIGH'
      }
    ],
    tacticalNotes: 'Direct, dynamic transitional power with Vinícius and Mbappé attacking the box supported by Valverde box-to-box runs.'
  },
  'Barcelona': {
    manager: 'Hansi Flick',
    formation: '4-2-3-1',
    startingXI: [
      'Iñaki Peña (GK)',
      'Jules Koundé (RB)',
      'Pau Cubarsí (CB)',
      'Íñigo Martínez (CB)',
      'Alejandro Balde (LB)',
      'Marc Casadó (DM)',
      'Pedri (CM)',
      'Lamine Yamal (RW)',
      'Dani Olmo (AM)',
      'Raphinha (LW)',
      'Robert Lewandowski (CF)'
    ],
    bench: ['Wojciech Szczęsny (GK)', 'Héctor Fort (DEF)', 'Gerard Martín (DEF)', 'Frenkie de Jong (MID)', 'Gavi (MID)', 'Pablo Torre (MID)', 'Fermín López (MID)', 'Pau Víctor (FWD)', 'Ansu Fati (FWD)'],
    absences: [
      {
        player: 'Marc-André ter Stegen',
        position: 'GK',
        reason: 'Patellar tendon rupture surgery',
        status: 'OUT',
        impactLevel: 'HIGH'
      },
      {
        player: 'Ronald Araújo',
        position: 'CB',
        reason: 'Hamstring tendon injury recovery',
        status: 'OUT',
        impactLevel: 'HIGH'
      },
      {
        player: 'Andreas Christensen',
        position: 'CB',
        reason: 'Achilles tendon tendinopathy',
        status: 'OUT',
        impactLevel: 'MEDIUM'
      }
    ],
    tacticalNotes: 'Extreme high defensive offside trap with rapid Gegenpressing and inverted wing creativity from Yamal & Raphinha.'
  },
  'Liverpool': {
    manager: 'Arne Slot',
    formation: '4-2-3-1',
    startingXI: [
      'Alisson Becker (GK)',
      'Trent Alexander-Arnold (RB)',
      'Ibrahima Konaté (CB)',
      'Virgil van Dijk (CB)',
      'Andy Robertson (LB)',
      'Ryan Gravenberch (DM)',
      'Alexis Mac Allister (CM)',
      'Mohamed Salah (RW)',
      'Dominik Szoboszlai (AM)',
      'Luis Díaz (LW)',
      'Darwin Núñez (CF)'
    ],
    bench: ['Caoimhin Kelleher (GK)', 'Conor Bradley (DEF)', 'Jarell Quansah (DEF)', 'Kostas Tsimikas (DEF)', 'Wataru Endo (MID)', 'Curtis Jones (MID)', 'Harvey Elliott (MID)', 'Cody Gakpo (FWD)', 'Federico Chiesa (FWD)'],
    absences: [
      {
        player: 'Diogo Jota',
        position: 'CF',
        reason: 'Upper body rib cage impact injury',
        status: 'OUT',
        impactLevel: 'HIGH'
      },
      {
        player: 'Harvey Elliott',
        position: 'AM',
        reason: 'Foot fracture recovery',
        status: 'DOUBTFUL',
        impactLevel: 'MEDIUM'
      }
    ],
    tacticalNotes: 'Disciplined build-up with Gravenberch controlling tempo and Alexander-Arnold spraying diagonal passes to Salah.'
  },
  'Manchester United': {
    manager: 'Rúben Amorim',
    formation: '3-4-2-1',
    startingXI: [
      'André Onana (GK)',
      'Noussair Mazraoui (RCB)',
      'Matthijs de Ligt (CB)',
      'Lisandro Martínez (LCB)',
      'Diogo Dalot (RWB)',
      'Casemiro (CM)',
      'Kobbie Mainoo (CM)',
      'Luke Shaw (LWB)',
      'Bruno Fernandes (AM)',
      'Alejandro Garnacho (AM)',
      'Rasmus Højlund (CF)'
    ],
    bench: ['Altay Bayındır (GK)', 'Harry Maguire (DEF)', 'Leny Yoro (DEF)', 'Jonny Evans (DEF)', 'Manuel Ugarte (MID)', 'Christian Eriksen (MID)', 'Mason Mount (MID)', 'Amad Diallo (FWD)', 'Marcus Rashford (FWD)', 'Joshua Zirkzee (FWD)'],
    absences: [
      {
        player: 'Leny Yoro',
        position: 'CB',
        reason: 'Metatarsal foot rehabilitation',
        status: 'DOUBTFUL',
        impactLevel: 'MEDIUM'
      },
      {
        player: 'Tyrell Malacia',
        position: 'LB',
        reason: 'Knee injury conditioning',
        status: 'DOUBTFUL',
        impactLevel: 'LOW'
      }
    ],
    tacticalNotes: 'Amorim 3-4-2-1 with aggressive wing-back verticality, twin inside-forwards supporting Højlund, and high counter-pressing.'
  },
  'Sporting CP': {
    manager: 'João Pereira',
    formation: '3-4-2-1',
    startingXI: [
      'Franco Israel (GK)',
      'Zeno Debast (RCB)',
      'Ousmane Diomande (CB)',
      'Gonçalo Inácio (LCB)',
      'Geovany Quenda (RWB)',
      'Hidemasa Morita (CM)',
      'Morten Hjulmand (CM)',
      'Maximiliano Araújo (LWB)',
      'Francisco Trincão (AM)',
      'Pedro Gonçalves (AM)',
      'Viktor Gyökeres (CF)'
    ],
    bench: ['Vladan Kovačević (GK)', 'Jeremiah St. Juste (DEF)', 'Matheus Reis (DEF)', 'Ricardo Esgaio (DEF)', 'Daniel Bragança (MID)', 'Marcus Edwards (FWD)', 'Geny Catamo (FWD)', 'Conrad Harder (FWD)'],
    absences: [
      {
        player: 'Nuno Santos',
        position: 'LWB',
        reason: 'Patellar tendon rupture surgery',
        status: 'OUT',
        impactLevel: 'HIGH'
      },
      {
        player: 'Eduardo Quaresma',
        position: 'CB',
        reason: 'Thigh muscle strain',
        status: 'DOUBTFUL',
        impactLevel: 'MEDIUM'
      }
    ],
    tacticalNotes: 'High-intensity 3-4-2-1 feeding relentless vertical channel balls into Viktor Gyökeres.'
  },
  'Marseille': {
    manager: 'Roberto De Zerbi',
    formation: '4-2-3-1',
    startingXI: [
      'Gerónimo Rulli (GK)',
      'Michael Murillo (RB)',
      'Leonardo Balerdi (CB)',
      'Derek Cornelius (CB)',
      'Quentin Merlin (LB)',
      'Pierre-Emile Højbjerg (DM)',
      'Geoffrey Kondogbia (CM)',
      'Mason Greenwood (RW)',
      'Amine Harit (AM)',
      'Luis Henrique (LW)',
      'Elye Wahi (CF)'
    ],
    bench: ['Jeffrey de Lange (GK)', 'Pol Lirola (DEF)', 'Bamo Meïté (DEF)', 'Valentin Rongier (MID)', 'Ismaël Koné (MID)', 'Jonathan Rowe (FWD)', 'Neal Maupay (FWD)'],
    absences: [
      {
        player: 'Faris Moumbagna',
        position: 'CF',
        reason: 'Ruptured anterior cruciate ligament (ACL)',
        status: 'OUT',
        impactLevel: 'HIGH'
      },
      {
        player: 'Rubén Blanco',
        position: 'GK',
        reason: 'Ankle ligament injury',
        status: 'OUT',
        impactLevel: 'MEDIUM'
      }
    ],
    tacticalNotes: 'De Zerbi positional build-up baiting opponent press to release Mason Greenwood and Elye Wahi.'
  },
  'Strasbourg': {
    manager: 'Liam Rosenior',
    formation: '3-4-1-2',
    startingXI: [
      'Đorđe Petrović (GK)',
      'Guela Doué (RCB)',
      'Saïdou Sow (CB)',
      'Mamadou Sarr (LCB)',
      'Dilane Bakwa (RWB)',
      'Andrey Santos (CM)',
      'Ismaël Doukouré (CM)',
      'Diego Moreira (LWB)',
      'Habib Diarra (AM)',
      'Sebastian Nanasi (CF)',
      'Emanuel Emegha (CF)'
    ],
    bench: ['Robin Risser (GK)', 'Marvin Senaya (DEF)', 'Abakar Sylla (DEF)', 'Junior Mwanga (MID)', 'Félix Lemaréchal (MID)', 'Sekou Mara (FWD)', 'Rayane Messi (FWD)'],
    absences: [
      {
        player: 'Miloš Luković',
        position: 'CF',
        reason: 'Knee injury rehabilitation',
        status: 'OUT',
        impactLevel: 'MEDIUM'
      },
      {
        player: 'Thomas Delaine',
        position: 'LB',
        reason: 'Calf strain',
        status: 'DOUBTFUL',
        impactLevel: 'LOW'
      }
    ],
    tacticalNotes: 'Direct, athletic 3-4-1-2 driven through Andrey Santos in central midfield and Emegha runs.'
  },
  'Paris Saint-Germain': {
    manager: 'Luis Enrique',
    formation: '4-3-3',
    startingXI: [
      'Gianluigi Donnarumma (GK)',
      'Achraf Hakimi (RB)',
      'Marquinhos (CB)',
      'Willian Pacho (CB)',
      'Nuno Mendes (LB)',
      'Warren Zaïre-Emery (CM)',
      'Vitinha (DM)',
      'João Neves (CM)',
      'Ousmane Dembélé (RW)',
      'Bradley Barcola (LW)',
      'Marco Asensio (CF)'
    ],
    bench: ['Matvey Safonov (GK)', 'Lucas Beraldo (DEF)', 'Milan Škriniar (DEF)', 'Fabián Ruiz (MID)', 'Senny Mayulu (MID)', 'Lee Kang-in (FWD)', 'Randal Kolo Muani (FWD)', 'Gonçalo Ramos (FWD)'],
    absences: [
      {
        player: 'Presnel Kimpembe',
        position: 'CB',
        reason: 'Achilles tendon rehabilitation',
        status: 'OUT',
        impactLevel: 'MEDIUM'
      },
      {
        player: 'Lucas Hernández',
        position: 'CB/LB',
        reason: 'Left knee anterior cruciate ligament recovery',
        status: 'OUT',
        impactLevel: 'HIGH'
      }
    ],
    tacticalNotes: 'Relentless possession retention, counter-pressing triggers within 5 seconds of loss, and wide 1v1 isolation for Dembélé & Barcola.'
  },
  'Le Havre': {
    manager: 'Didier Digard',
    formation: '5-3-2',
    startingXI: [
      'Arthur Desmas (GK)',
      'Loïc Négo (RWB)',
      'Arouna Sangante (CB)',
      'Yoann Salmier (CB)',
      'Gautier Lloris (CB)',
      'Christopher Opéri (LWB)',
      'Abdoulaye Touré (DM)',
      'Yassine Kechta (CM)',
      'Rassoul Ndiaye (CM)',
      'Josué Casimir (CF)',
      'Emmanuel Sabbi (CF)'
    ],
    bench: ['Mathieu Gorgelin (GK)', 'Étienne Youté Kinkoué (DEF)', 'Yaniss Zouaoui (DEF)', 'Oussama Targhalline (MID)', 'Aloïs Confais (MID)', 'Antoine Joujou (FWD)', 'Steve Ngoura (FWD)'],
    absences: [
      {
        player: 'Oualid El Hajjam',
        position: 'RB',
        reason: 'Calf muscle tear',
        status: 'OUT',
        impactLevel: 'MEDIUM'
      },
      {
        player: 'Andy Logbo',
        position: 'CF',
        reason: 'Cruciate ligament reconstruction',
        status: 'OUT',
        impactLevel: 'LOW'
      }
    ],
    tacticalNotes: 'Ultra-compact defensive lines designed to choke half-spaces in the defensive third.'
  },
  'Rio Ave': {
    manager: 'Luís Freire',
    formation: '3-4-3',
    startingXI: [
      'Jhonatan (GK)',
      'Renato Pantalon (RCB)',
      'Aderllan Santos (CB)',
      'Patrick William (LCB)',
      'Marios Vrousai (RWB)',
      'Amine Oudrhiri (CM)',
      'João Novais (CM)',
      'Omar Richards (LWB)',
      'Kiko Bondoso (RW)',
      'Clayton Silva (CF)',
      'Tiago Morais (LW)'
    ],
    bench: ['Cezary Miszta (GK)', 'Jonathan Panzo (DEF)', 'João Tomé (DEF)', 'Georgios Liavas (MID)', 'Demir Ege Tıknaz (MID)', 'Fábio Ronaldo (FWD)', 'Ole Pohlmann (FWD)'],
    absences: [
      {
        player: 'Brandon Aguilera',
        position: 'AM',
        reason: 'Thigh muscle strain',
        status: 'OUT',
        impactLevel: 'MEDIUM'
      },
      {
        player: 'Renato Pantalon',
        position: 'CB',
        reason: 'Right ankle knock in training',
        status: 'QUESTIONABLE',
        impactLevel: 'LOW'
      }
    ],
    tacticalNotes: 'Low defensive block with 5 defenders off the ball, relying on Clayton Silva to hold up play on transitions.'
  },
  'Al-Nassr': {
    manager: 'Stefano Pioli',
    formation: '4-2-3-1',
    startingXI: [
      'Bento (GK)',
      'Sultan Al-Ghannam (RB)',
      'Mohamed Simakan (CB)',
      'Aymeric Laporte (CB)',
      'Salem Al-Najdi (LB)',
      'Abdullah Al-Khaibari (DM)',
      'Marcelo Brozović (CM)',
      'Anderson Talisca (RW)',
      'Otávio (AM)',
      'Sadio Mané (LW)',
      'Cristiano Ronaldo (CF)'
    ],
    bench: ['Raghed Al-Najjar (GK)', 'Ali Lajami (DEF)', 'Nawaf Boushal (DEF)', 'Mukhtar Ali (MID)', 'Abdulmajeed Al-Sulaiheem (MID)', 'Abdulrahman Ghareeb (FWD)', 'Wesley (FWD)', 'Ângelo Gabriel (FWD)'],
    absences: [
      {
        player: 'Sami Al-Najei',
        position: 'CM',
        reason: 'Cruciate ligament injury',
        status: 'OUT',
        impactLevel: 'HIGH'
      },
      {
        player: 'Ayman Yahya',
        position: 'RW',
        reason: 'Hamstring muscle tightness',
        status: 'DOUBTFUL',
        impactLevel: 'MEDIUM'
      }
    ],
    tacticalNotes: 'High-octane offensive transition focusing on Brozović distribution and Ronaldo box presence.'
  },
  'Al-Ahli': {
    manager: 'Matthias Jaissle',
    formation: '4-2-3-1',
    startingXI: [
      'Édouard Mendy (GK)',
      'Ali Majrashi (RB)',
      'Merih Demiral (CB)',
      'Roger Ibañez (CB)',
      'Abdullah Al-Ammar (LB)',
      'Franck Kessié (DM)',
      'Ziyad Al-Johani (CM)',
      'Riyad Mahrez (RW)',
      'Gabri Veiga (AM)',
      'Firas Al-Buraikan (LW)',
      'Ivan Toney (CF)'
    ],
    bench: ['Abdulrahman Al-Sanbi (GK)', 'Rayan Hamed (DEF)', 'Bassam Al-Hurayji (DEF)', 'Ali Al-Asmari (MID)', 'Valentin Eysseric (MID)', 'Sumayhan Al-Nabit (FWD)', 'Roberto Firmino (FWD)'],
    absences: [
      {
        player: 'Ezgjan Alioski',
        position: 'LB',
        reason: 'Ineligible foreign quota / squad registration',
        status: 'OUT',
        impactLevel: 'LOW'
      },
      {
        player: 'Abdullah Otayf',
        position: 'CM',
        reason: 'Cruciate ligament recovery',
        status: 'OUT',
        impactLevel: 'LOW'
      }
    ],
    tacticalNotes: 'Aggressive Gegenpressing with Mahrez chance creation and Ivan Toney physical focal point in the box.'
  },
  'Al-Ettifaq': {
    manager: 'Steven Gerrard',
    formation: '4-3-3',
    startingXI: [
      'Marek Rodák (GK)',
      'Madallah Al-Olayan (RB)',
      'Marcel Tisserand (CB)',
      'Jack Hendry (CB)',
      'Hamdan Al-Shamrani (LB)',
      'Seko Fofana (CM)',
      'Georginio Wijnaldum (CM)',
      'Alvaro Medran (AM)',
      'Karl Toko Ekambi (LW)',
      'Vitinho (RW)',
      'Moussa Dembélé (CF)'
    ],
    bench: ['Ahmed Al-Rehaili (GK)', 'Meshal Al-Alaeli (DEF)', 'Ali Hazazi (MID)', 'Demarai Gray (FWD)', 'Thamer Al-Khaibri (FWD)'],
    absences: [
      {
        player: 'Jack Hendry',
        position: 'CB',
        reason: 'Knee ligament strain',
        status: 'DOUBTFUL',
        impactLevel: 'MEDIUM'
      }
    ],
    tacticalNotes: 'Physical midfield triangle anchored by Wijnaldum and Fofana, delivering quick through-balls to Toko Ekambi and Dembélé.'
  },
  'Inter Milan': {
    manager: 'Simone Inzaghi',
    formation: '3-5-2',
    startingXI: [
      'Yann Sommer (GK)',
      'Benjamin Pavard (CB)',
      'Francesco Acerbi (CB)',
      'Alessandro Bastoni (CB)',
      'Matteo Darmian (RWB)',
      'Nicolò Barella (CM)',
      'Hakan Çalhanoğlu (DM)',
      'Henrikh Mkhitaryan (CM)',
      'Federico Dimarco (LWB)',
      'Marcus Thuram (CF)',
      'Lautaro Martínez (CF)'
    ],
    bench: ['Josep Martínez (GK)', 'Stefan de Vrij (DEF)', 'Yann Bisseck (DEF)', 'Carlos Augusto (DEF)', 'Davide Frattesi (MID)', 'Piotr Zieliński (MID)', 'Kristjan Asllani (MID)', 'Mehdi Taremi (FWD)', 'Joaquín Correa (FWD)'],
    absences: [
      {
        player: 'Tajon Buchanan',
        position: 'RWB',
        reason: 'Tibia fracture rehabilitation',
        status: 'OUT',
        impactLevel: 'MEDIUM'
      }
    ],
    tacticalNotes: 'Overlapping central defenders with Dimarco and Barella creating wide triangles; lethal two-striker combination of Lautaro and Thuram.'
  },
  'Atalanta': {
    manager: 'Gian Piero Gasperini',
    formation: '3-4-2-1',
    startingXI: [
      'Marco Carnesecchi (GK)',
      'Berat Djimsiti (CB)',
      'Isak Hien (CB)',
      'Sead Kolašinac (CB)',
      'Raoul Bellanova (RWB)',
      'Marten de Roon (CM)',
      'Éderson (CM)',
      'Matteo Ruggeri (LWB)',
      'Charles De Ketelaere (AM)',
      'Ademola Lookman (AM)',
      'Mateo Retegui (CF)'
    ],
    bench: ['Rui Patrício (GK)', 'Ben Godfrey (DEF)', 'Mario Pašalić (MID)', 'Lazar Samardžić (MID)', 'Marco Brescianini (MID)', 'Nicolò Zaniolo (FWD)'],
    absences: [
      {
        player: 'Gianluca Scamacca',
        position: 'CF',
        reason: 'Cruciate ligament rupture',
        status: 'OUT',
        impactLevel: 'HIGH'
      },
      {
        player: 'Giorgio Scalvini',
        position: 'CB',
        reason: 'ACL injury rehabilitation',
        status: 'OUT',
        impactLevel: 'HIGH'
      }
    ],
    tacticalNotes: 'Aggressive man-to-man pressing across the entire pitch with Lookman dynamic isolation and Retegui box finishing.'
  },
  'Lyon': {
    manager: 'Pierre Sage',
    formation: '4-3-3',
    startingXI: [
      'Lucas Perri (GK)',
      'Ainsley Maitland-Niles (RB)',
      'Clinton Mata (CB)',
      'Duje Ćaleta-Car (CB)',
      'Nicolás Tagliafico (LB)',
      'Maxence Caqueret (CM)',
      'Nemanja Matić (DM)',
      'Corentin Tolisso (CM)',
      'Ernest Nuamah (RW)',
      'Alexandre Lacazette (CF)',
      'Saïd Benrahma (LW)'
    ],
    bench: ['Anthony Lopes (GK)', 'Abner Vinícius (DEF)', 'Moussa Niakhaté (DEF)', 'Tanner Tessmann (MID)', 'Jordan Veretout (MID)', 'Rayan Cherki (MID)', 'Wilfried Zaha (FWD)', 'Georges Mikautadze (FWD)', 'Gift Orban (FWD)'],
    absences: [
      {
        player: 'Nicolás Tagliafico',
        position: 'LB',
        reason: 'Muscular calf strain',
        status: 'DOUBTFUL',
        impactLevel: 'MEDIUM'
      }
    ],
    tacticalNotes: 'High possession retention directed by Matić and Caqueret, with dynamic wing play through Nuamah and Benrahma feeding Lacazette.'
  },
  'Union Berlin': {
    manager: 'Bo Svensson',
    formation: '3-4-2-1',
    startingXI: [
      'Frederik Rønnow (GK)',
      'Danilho Doekhi (CB)',
      'Kevin Vogt (CB)',
      'Diogo Leite (CB)',
      'Christopher Trimmel (RWB)',
      'Aljoscha Kemlein (CM)',
      'Rani Khedira (DM)',
      'Tom Rothe (LWB)',
      'Benedict Hollerbach (AM)',
      'Woo-yeong Jeong (AM)',
      'Jordan Siebatcheu (CF)'
    ],
    bench: ['Alexander Schwolow (GK)', 'Leopold Querfeld (DEF)', 'Janik Haberer (MID)', 'László Bénes (MID)', 'Tim Skarke (FWD)', 'Yorbe Vertessen (FWD)'],
    absences: [
      {
        player: 'Josip Juranović',
        position: 'RB',
        reason: 'Ankle surgery recovery',
        status: 'OUT',
        impactLevel: 'HIGH'
      },
      {
        player: 'Yannic Stein',
        position: 'GK',
        reason: 'Shoulder injury',
        status: 'OUT',
        impactLevel: 'LOW'
      }
    ],
    tacticalNotes: 'Disciplined compact defensive block with direct transitions and dangerous set-piece delivery from Christopher Trimmel.'
  },
  'FC St. Pauli': {
    manager: 'Alexander Blessin',
    formation: '3-5-2',
    startingXI: [
      'Nikola Vasilj (GK)',
      'Hauke Wahl (CB)',
      'Eric Smith (CB)',
      'Karol Mets (CB)',
      'Manolis Saliakas (RWB)',
      'Jackson Irvine (CM)',
      'Robert Wagner (DM)',
      'Carlo Boukhalfa (CM)',
      'Philipp Treu (LWB)',
      'Johannes Eggestein (CF)',
      'Morgan Guilavogui (CF)'
    ],
    bench: ['Sascha Burchert (GK)', 'Adam Dźwigała (DEF)', 'Lars Ritzka (DEF)', 'Connor Metcalfe (MID)', 'Danel Sinani (MID)', 'Scott Banks (FWD)', 'Oladapo Afolayan (FWD)'],
    absences: [
      {
        player: 'Sören Ahlers',
        position: 'GK',
        reason: 'Knee injury',
        status: 'OUT',
        impactLevel: 'LOW'
      },
      {
        player: 'Simon Zoller',
        position: 'CF',
        reason: 'Muscular thigh problem',
        status: 'OUT',
        impactLevel: 'MEDIUM'
      }
    ],
    tacticalNotes: 'Intense midfield ball-winning led by Jackson Irvine, with quick vertical counter-attacks to Eggestein and Guilavogui.'
  },
  'Celta Vigo': {
    manager: 'Claudio Giráldez',
    formation: '3-4-3',
    startingXI: [
      'Vicente Guaita (GK)',
      'Javi Rodríguez (CB)',
      'Carl Starfelt (CB)',
      'Jailson (CB)',
      'Óscar Mingueza (RWB)',
      'Fran Beltrán (CM)',
      'Hugo Sotelo (CM)',
      'Hugo Álvarez (LWB)',
      'Iago Aspas (RW)',
      'Borja Iglesias (CF)',
      'Jonathan Bamba (LW)'
    ],
    bench: ['Iván Villar (GK)', 'Carlos Domínguez (DEF)', 'Sergio Carreira (DEF)', 'Ilaix Moriba (MID)', 'Damián Rodríguez (MID)', 'Williot Swedberg (FWD)', 'Anastasios Douvikas (FWD)', 'Pablo Durán (FWD)'],
    absences: [
      {
        player: 'Mihailo Ristić',
        position: 'LB',
        reason: 'Calf muscle injury',
        status: 'OUT',
        impactLevel: 'MEDIUM'
      },
      {
        player: 'Luca de la Torre',
        position: 'CM',
        reason: 'Ankle sprain',
        status: 'DOUBTFUL',
        impactLevel: 'LOW'
      }
    ],
    tacticalNotes: 'Modern attacking positional play with Óscar Mingueza stepping into midfield and Iago Aspas orchestrating from the right half-space.'
  },
  'Deportivo Alaves': {
    manager: 'Luis García Plaza',
    formation: '4-2-3-1',
    startingXI: [
      'Antonio Sivera (GK)',
      'Nahuel Tenaglia (RB)',
      'Abdel Abqar (CB)',
      'Aleksandar Sedlar (CB)',
      'Manu Sánchez (LB)',
      'Ander Guevara (DM)',
      'Antonio Blanco (DM)',
      'Carlos Vicente (RW)',
      'Jon Guridi (AM)',
      'Tomás Conechny (LW)',
      'Kike García (CF)'
    ],
    bench: ['Jesús Owono (GK)', 'Moussa Diarra (DEF)', 'Hugo Novoa (DEF)', 'Joan Jordán (MID)', 'Carlos Protesoni (MID)', 'Luka Romero (FWD)', 'Toni Martínez (FWD)', 'Asier Villalibre (FWD)'],
    absences: [
      {
        player: 'Hugo Novoa',
        position: 'RB',
        reason: 'Muscular discomfort',
        status: 'DOUBTFUL',
        impactLevel: 'LOW'
      }
    ],
    tacticalNotes: 'Solid double pivot defensive screening with Carlos Vicente providing high cross volume into veteran target man Kike García.'
  },
  'Luton Town': {
    manager: 'Rob Edwards',
    formation: '3-4-1-2',
    startingXI: [
      'Thomas Kaminski (GK)',
      'Teden Mengi (CB)',
      'Mark McGuinness (CB)',
      'Amari\'i Bell (CB)',
      'Reuell Walters (RWB)',
      'Marvelous Nakamba (DM)',
      'Jordan Clark (CM)',
      'Alfie Doughty (LWB)',
      'Tahith Chong (AM)',
      'Carlton Morris (CF)',
      'Elijah Adebayo (CF)'
    ],
    bench: ['Tim Krul (GK)', 'Mads Andersen (DEF)', 'Joe Johnson (DEF)', 'Liam Walsh (MID)', 'Shandon Baptiste (MID)', 'Zack Nelson (MID)', 'Cauley Woodrow (FWD)', 'Victor Moses (FWD)'],
    absences: [
      {
        player: 'Tom Lockyer',
        position: 'CB',
        reason: 'Medical recovery protocol',
        status: 'OUT',
        impactLevel: 'HIGH'
      },
      {
        player: 'Daiki Hashioka',
        position: 'RB',
        reason: 'Calf injury',
        status: 'OUT',
        impactLevel: 'MEDIUM'
      }
    ],
    tacticalNotes: 'Direct, physical style utilizing Alfie Doughty pinpoint crossing for twin strikers Morris and Adebayo in aerial duels.'
  },
  'Queens Park Rangers': {
    manager: 'Martí Cifuentes',
    formation: '4-2-3-1',
    startingXI: [
      'Paul Nardi (GK)',
      'Jimmy Dunne (RB)',
      'Steve Cook (CB)',
      'Jake Clarke-Salter (CB)',
      'Kenneth Paal (LB)',
      'Jonathan Varane (DM)',
      'Sam Field (DM)',
      'Kader Dembélé (RW)',
      'Lucas Andersen (AM)',
      'Koki Saito (LW)',
      'Michael Frey (CF)'
    ],
    bench: ['Joe Walsh (GK)', 'Harrison Ashby (DEF)', 'Morgan Fox (DEF)', 'Jack Colback (MID)', 'Nicolas Madsen (MID)', 'Paul Smyth (FWD)', 'Žan Celar (FWD)', 'Rayhaan Tulloch (FWD)'],
    absences: [
      {
        player: 'Ilias Chair',
        position: 'AM',
        reason: 'Back injury rehabilitation',
        status: 'OUT',
        impactLevel: 'HIGH'
      },
      {
        player: 'Liam Morrison',
        position: 'CB',
        reason: 'Knee injury',
        status: 'OUT',
        impactLevel: 'MEDIUM'
      }
    ],
    tacticalNotes: 'Possession-oriented structure engineered by Martí Cifuentes, relying on Kader Dembélé and Koki Saito for 1v1 dribble penetration.'
  },
  'FC Porto': {
    manager: 'Vítor Bruno',
    formation: '4-2-3-1',
    startingXI: [
      'Diogo Costa (GK)',
      'Martim Fernandes (RB)',
      'Zé Pedro (CB)',
      'Nehuén Pérez (CB)',
      'Moura (LB)',
      'Alan Varela (DM)',
      'Nico González (CM)',
      'Pepê (RW)',
      'Iván Jaime (AM)',
      'Galeno (LW)',
      'Samu Omorodion (CF)'
    ],
    bench: ['Cláudio Ramos (GK)', 'Otávio (DEF)', 'Tiago Djaló (DEF)', 'Stephen Eustáquio (MID)', 'Vasco Sousa (MID)', 'Fábio Vieira (MID)', 'Gonçalo Borges (FWD)', 'Danny Namaso (FWD)', 'Fran Navarro (FWD)'],
    absences: [
      {
        player: 'Iván Marcano',
        position: 'CB',
        reason: 'ACL tear rehabilitation',
        status: 'OUT',
        impactLevel: 'MEDIUM'
      },
      {
        player: 'Zaidu Sanusi',
        position: 'LB',
        reason: 'Cruciate ligament recovery',
        status: 'OUT',
        impactLevel: 'MEDIUM'
      }
    ],
    tacticalNotes: 'High-octane pressing with Alan Varela controlling tempo, Nico González driving forward, and Samu Omorodion providing explosive physical box presence.'
  },
  'Genk': {
    manager: 'Thorsten Fink',
    formation: '4-2-3-1',
    startingXI: [
      'Hendrik Van Crombrugge (GK)',
      'Zakaria El Ouahdi (RB)',
      'Mujaid Sadick (CB)',
      'Matte Smets (CB)',
      'Joris Kayembe (LB)',
      'Bryan Heynen (CM)',
      'Patrik Hrošovský (DM)',
      'Jarne Steuckers (RW)',
      'Konstantinos Karetsas (AM)',
      'Christopher Bonsu Baah (LW)',
      'Tolu Arokodare (CF)'
    ],
    bench: ['Mike Penders (GK)', 'Carlos Cuesta (DEF)', 'Josue Kongolo (DEF)', 'Ibrahima Bangoura (MID)', 'Nikolas Sattlberger (MID)', 'Yira Sor (FWD)', 'Oh Hyeon-gyu (FWD)'],
    absences: [
      {
        player: 'Luca Oyen',
        position: 'LW',
        reason: 'Cruciate ligament rehabilitation',
        status: 'OUT',
        impactLevel: 'MEDIUM'
      }
    ],
    tacticalNotes: 'Thorsten Fink fluid possession model featuring wonderkid Karetsas playmaking and Tolu Arokodare dominant target hold-up play.'
  },
  'Westerlo': {
    manager: 'Timmy Simons',
    formation: '4-3-3',
    startingXI: [
      'Sinan Bolat (GK)',
      'Bryan Reynolds (RB)',
      'Luka Vušković (CB)',
      'Emin Bayram (CB)',
      'Jordan Bos (LB)',
      'Arthur Piedfort (DM)',
      'Dogucan Haspolat (CM)',
      'Alfie Devine (AM)',
      'Allahyar Sayyadmanesh (RW)',
      'Matija Frigan (CF)',
      'Josimar Alcócer (LW)'
    ],
    bench: ['Koen Van Langendonck (GK)', 'Roman Neustädter (DEF)', 'Edisson Jordanov (DEF)', 'Thomas Van den Keybus (MID)', 'Serhiy Sydorchuk (MID)', 'Adedire Mebude (FWD)', 'Julian Placias (FWD)'],
    absences: [
      {
        player: 'Griffin Yow',
        position: 'RW',
        reason: 'Knee sprain',
        status: 'DOUBTFUL',
        impactLevel: 'HIGH'
      }
    ],
    tacticalNotes: 'High-energy wide transitions led by American full-back Bryan Reynolds and Tottenham loanee Alfie Devine linking with Sayyadmanesh.'
  },
  'FC Groningen': {
    manager: 'Dick Lukkien',
    formation: '4-2-3-1',
    startingXI: [
      'Etienne Vaessen (GK)',
      'Leandro Bacuna (RB)',
      'Marco Rente (CB)',
      'Thijmen Blokzijl (CB)',
      'Marvin Peersman (LB)',
      'Johan Hove (DM)',
      'Stije Resink (CM)',
      'Jorg Schreuders (RW)',
      'Luciano Valente (AM)',
      'Rui Mendes (LW)',
      'Thom van Bergen (CF)'
    ],
    bench: ['Hidde Jurjus (GK)', 'Finn Stam (DEF)', 'Sven Bouland (DEF)', 'Tika de Jonge (MID)', 'Joey Pelupessy (MID)', 'Brynjólfur Willumsson (FWD)', 'Kian Slor (FWD)', 'Romano Postema (CF)'],
    absences: [
      {
        player: 'Romano Postema',
        position: 'CF',
        reason: 'Muscular thigh strain',
        status: 'DOUBTFUL',
        impactLevel: 'MEDIUM'
      },
      {
        player: 'Tika de Jonge',
        position: 'CM',
        reason: 'Ankle injury',
        status: 'QUESTIONABLE',
        impactLevel: 'LOW'
      }
    ],
    tacticalNotes: 'Organized pressing from Dick Lukkien setup with veteran Leandro Bacuna leading right-side progressions and Luciano Valente providing creativity.'
  },
  'Fortuna Sittard': {
    manager: 'Danny Buijs',
    formation: '4-3-3',
    startingXI: [
      'Mattijs Branderhorst (GK)',
      'Ivo Pinto (RB)',
      'Rodrigo Guth (CB)',
      'Shawn Adewoye (CB)',
      'Jasper Dahlhaus (LB)',
      'Loreintz Rosier (DM)',
      'Ryan Fosso (CM)',
      'Ezequiel Bullaude (AM)',
      'Alen Halilović (RW)',
      'Makan Aïko (LW)',
      'Ante Erceg (CF)'
    ],
    bench: ['Luuk Koopmans (GK)', 'Darijo Grujcic (DEF)', 'Syb van Ottele (DEF)', 'Josip Mitrović (MID)', 'Tristan Schenkhuizen (MID)', 'Kristoffer Peterson (FWD)', 'Kaj Sierhuis (CF)', 'Alessio da Cruz (FWD)'],
    absences: [
      {
        player: 'Kaj Sierhuis',
        position: 'CF',
        reason: 'Cruciate ligament injury rehabilitation',
        status: 'OUT',
        impactLevel: 'HIGH'
      },
      {
        player: 'Alessio da Cruz',
        position: 'FWD',
        reason: 'Foot injury',
        status: 'OUT',
        impactLevel: 'MEDIUM'
      }
    ],
    tacticalNotes: 'Compact low-to-mid defensive block managed by Danny Buijs, with Alen Halilović dictating transition tempo and set-piece creation.'
  },
  'Venezia': {
    manager: 'Eusebio Di Francesco',
    formation: '3-4-2-1',
    startingXI: [
      'Jesse Joronen (GK)',
      'Jay Idzes (CB)',
      'Michael Svoboda (CB)',
      'Marin Šverko (CB)',
      'Antonio Candela (RWB)',
      'Alfred Duncan (CM)',
      'Hans Nicolussi Caviglia (CM)',
      'Francesco Zampano (LWB)',
      'Gaetano Oristanio (AM)',
      'Mikael Ellertsson (AM)',
      'Joel Pohjanpalo (CF)'
    ],
    bench: ['Matteo Grandi (GK)', 'Giorgio Altare (DEF)', 'Ridgeciano Haps (DEF)', 'Mikael Egill Ellertsson (MID)', 'Gianluca Busio (MID)', 'Christian Gytkjær (FWD)', 'John Yeboah (FWD)'],
    absences: [
      {
        player: 'Bjarki Steinn Bjarkason',
        position: 'LW',
        reason: 'Hernia surgery rehabilitation',
        status: 'OUT',
        impactLevel: 'MEDIUM'
      }
    ],
    tacticalNotes: 'Direct wing progression with Candela and Zampano crossing to target forward Joel Pohjanpalo.'
  },
  'Torino': {
    manager: 'Paolo Vanoli',
    formation: '3-5-2',
    startingXI: [
      'Vanja Milinković-Savić (GK)',
      'Saúl Coco (CB)',
      'Guillermo Maripán (CB)',
      'Adam Masina (CB)',
      'Marcus Pedersen (RWB)',
      'Samuele Ricci (CM)',
      'Karol Linetty (DM)',
      'Ivan Ilić (CM)',
      'Valentino Lazaro (LWB)',
      'Ché Adams (CF)',
      'Antonio Sanabria (CF)'
    ],
    bench: ['Alberto Paleari (GK)', 'Sebastian Walukiewicz (DEF)', 'Borna Sosa (DEF)', 'Adrien Tamèze (MID)', 'Gvidas Gineitis (MID)', 'Yann Karamoh (FWD)', 'Alieu Njie (FWD)'],
    absences: [
      {
        player: 'Duván Zapata',
        position: 'CF',
        reason: 'Cruciate ligament ACL injury',
        status: 'OUT',
        impactLevel: 'HIGH'
      },
      {
        player: 'Perr Schuurs',
        position: 'CB',
        reason: 'Knee surgery rehabilitation',
        status: 'OUT',
        impactLevel: 'HIGH'
      }
    ],
    tacticalNotes: 'High pressing unit steered by Samuele Ricci in deep midfield with Ché Adams exploiting half-space channels.'
  },
  'West Ham United': {
    manager: 'Julen Lopetegui',
    formation: '4-2-3-1',
    startingXI: [
      'Alphonse Areola (GK)',
      'Aaron Wan-Bissaka (RB)',
      'Jean-Clair Todibo (CB)',
      'Max Kilman (CB)',
      'Emerson Palmieri (LB)',
      'Guido Rodríguez (DM)',
      'Edson Álvarez (DM)',
      'Jarrod Bowen (RW)',
      'Lucas Paquetá (AM)',
      'Mohammed Kudus (LW)',
      'Michail Antonio (CF)'
    ],
    bench: ['Łukasz Fabiański (GK)', 'Konstantinos Mavropanos (DEF)', 'Vladimír Coufal (DEF)', 'Tomáš Souček (MID)', 'Carlos Soler (MID)', 'Crysencio Summerville (FWD)', 'Danny Ings (FWD)'],
    absences: [
      {
        player: 'Niclas Füllkrug',
        position: 'CF',
        reason: 'Achilles tendon irritation',
        status: 'DOUBTFUL',
        impactLevel: 'MEDIUM'
      }
    ],
    tacticalNotes: 'Disciplined 4-2-3-1 block prioritizing quick transitions through Bowen and Kudus down the flanks.'
  },
  'Wolverhampton Wanderers': {
    manager: "Gary O'Neil",
    formation: '4-4-2',
    startingXI: [
      'Sam Johnstone (GK)',
      'Nélson Semedo (RB)',
      'Craig Dawson (CB)',
      'Toti Gomes (CB)',
      'Rayan Aït-Nouri (LB)',
      'Mario Lemina (CM)',
      'João Gomes (CM)',
      'Jean-Ricner Bellegarde (RM)',
      'Matheus Cunha (LM)',
      'Jørgen Strand Larsen (CF)',
      'Hee-chan Hwang (CF)'
    ],
    bench: ['José Sá (GK)', 'Matt Doherty (DEF)', 'Santiago Bueno (DEF)', 'André (MID)', 'Tommy Doyle (MID)', 'Rodrigo Gomes (FWD)', 'Gonçalo Guedes (FWD)'],
    absences: [
      {
        player: 'Saša Kalajdžić',
        position: 'CF',
        reason: 'Cruciate ligament rehabilitation',
        status: 'OUT',
        impactLevel: 'HIGH'
      },
      {
        player: 'Enso González',
        position: 'LW',
        reason: 'Knee injury rehabilitation',
        status: 'OUT',
        impactLevel: 'LOW'
      }
    ],
    tacticalNotes: 'Energetic high-pressing unit with Cunha dropping between the lines to link with Strand Larsen.'
  },
  'Birmingham City': {
    manager: 'Chris Davies',
    formation: '4-2-3-1',
    startingXI: [
      'Bailey Peacock-Farrell (GK)',
      'Ethan Laird (RB)',
      'Christoph Klarer (CB)',
      'Krystian Bielik (CB)',
      'Alex Cochrane (LB)',
      'Paik Seung-ho (DM)',
      'Tomoki Iwata (CM)',
      'Willum Willumsson (AM)',
      'Emil Hansson (RW)',
      'Keshi Anderson (LW)',
      'Jay Stansfield (CF)'
    ],
    bench: ['Ryan Allsop (GK)', 'Ben Davies (DEF)', 'Taylor Gardner-Hickman (MID)', 'Marc Leonard (MID)', 'Scott Wright (FWD)', 'Lyndon Dykes (FWD)', 'Alfie May (FWD)'],
    absences: [
      {
        player: 'Lee Buchanan',
        position: 'LB',
        reason: 'Calf strain recovery',
        status: 'OUT',
        impactLevel: 'MEDIUM'
      }
    ],
    tacticalNotes: 'Possession-dominant build-up with paired holding midfielders and Stansfield pressing from the front.'
  },
  'Southampton': {
    manager: 'Russell Martin',
    formation: '3-4-2-1',
    startingXI: [
      'Aaron Ramsdale (GK)',
      'Taylor Harwood-Bellis (CB)',
      'Jan Bednarek (CB)',
      'Jack Stephens (CB)',
      'Yukinari Sugawara (RWB)',
      'Flynn Downes (CM)',
      'Mateus Fernandes (CM)',
      'Kyle Walker-Peters (LWB)',
      'Tyler Dibling (AM)',
      'Adam Lallana (AM)',
      'Cameron Archer (CF)'
    ],
    bench: ['Alex McCarthy (GK)', 'Nathan Wood (DEF)', 'Charlie Taylor (DEF)', 'Joe Aribo (MID)', 'Lesley Ugochukwu (MID)', 'Ryan Fraser (FWD)', 'Adam Armstrong (FWD)', 'Paul Onuachu (FWD)'],
    absences: [
      {
        player: 'Gavin Bazunu',
        position: 'GK',
        reason: 'Achilles tendon rupture',
        status: 'OUT',
        impactLevel: 'HIGH'
      },
      {
        player: 'Ross Stewart',
        position: 'CF',
        reason: 'Muscular injury recovery',
        status: 'DOUBTFUL',
        impactLevel: 'MEDIUM'
      }
    ],
    tacticalNotes: 'High possession style with inverted wing-backs and swift vertical combinations through Dibling and Fernandes.'
  }
};

/**
 * Generates a realistic structured roster for any unindexed squad
 */
export function createGenericRosterWithRealNames(teamName: string, seed: number | string = 1): TeamRosterProfile {
  const numericSeed = typeof seed === 'number' 
    ? seed 
    : (seed.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) || 1);
  const pseudoRandom = (val: number) => ((val * 9301 + 49297) % 233280) / 233280;
  const formations = ['4-3-3', '4-2-3-1', '3-5-2', '4-4-2'];
  const formation = typeof seed === 'string' && formations.includes(seed) 
    ? seed 
    : formations[Math.floor(pseudoRandom(numericSeed) * formations.length)];

  return {
    manager: `${teamName} Head Coach`,
    formation,
    startingXI: [
      `Goalkeeper 1 (GK)`,
      `Right Back 2 (RB)`,
      `Center Back 4 (CB)`,
      `Center Back 5 (CB)`,
      `Left Back 3 (LB)`,
      `Defensive Midfielder 6 (DM)`,
      `Central Midfielder 8 (CM)`,
      `Attacking Midfielder 10 (AM)`,
      `Right Winger 7 (RW)`,
      `Left Winger 11 (LW)`,
      `Center Forward 9 (ST)`
    ],
    bench: [
      `Reserve Goalkeeper 12 (GK)`,
      `Defender 13 (CB)`,
      `Defender 14 (LB)`,
      `Midfielder 15 (CM)`,
      `Midfielder 16 (DM)`,
      `Winger 17 (RW)`,
      `Forward 18 (CF)`
    ],
    absences: [
      {
        player: `Squad Rotational Player (${teamName})`,
        position: 'MID',
        reason: 'Muscular fatigue management',
        status: 'QUESTIONABLE',
        impactLevel: 'LOW'
      }
    ],
    tacticalNotes: `Balanced ${formation} tactical structure with zonal marking and swift transition through wide channels.`
  };
}
