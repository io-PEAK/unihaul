import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))

// ─────────────────────────────────────────────────────────────
// MINI CSV PARSER  (no npm dep)
// ─────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim())
  const headers = csvSplit(lines[0]).map(h => h.replace(/^"|"$/g, '').trim())
  return lines.slice(1).map(line => {
    const vals = csvSplit(line)
    const obj = {}
    headers.forEach((h, i) => { obj[h] = (vals[i] || '').replace(/^"|"$/g, '').trim() })
    return obj
  })
}

function csvSplit(line) {
  const out = []; let cur = '', q = false
  for (const ch of line) {
    if (ch === '"') q = !q
    else if (ch === ',' && !q) { out.push(cur); cur = '' }
    else cur += ch
  }
  out.push(cur)
  return out
}

// ─────────────────────────────────────────────────────────────
// DEDUP KEY — strips noise so "IIT Delhi", "IIT, Delhi (New Delhi)"
// and "Indian Institute of Technology Delhi" all collapse to same key
// ─────────────────────────────────────────────────────────────
function dedupKey(name) {
  return name.toLowerCase()
    .replace(/more details.*$/g, '')
    .replace(/\s*-\s*\[.*?\]/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\b(university|institute|college|of|and|the|for|in|at|a)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanName(raw) {
  return raw
    .replace(/More Details.*$/g, '')
    .replace(/\s*-\s*\[.*?\]/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// ─────────────────────────────────────────────────────────────
// STATE NORMALIZER — fixes casing + known aliases from CSV data
// e.g. "delhi ncr" / "Delhi NCR" / "delhi NCR" → all become "Delhi NCR"
// e.g. "Orissa" → "Odisha", "Pondicherry" → "Puducherry"
// runs on every institution at load time so getStates() is always clean
// ─────────────────────────────────────────────────────────────
function normalizeState(state) {
  if (!state) return ''
  const map = {
    'delhi ncr':           'Delhi NCR',
    'delhi':               'Delhi',
    'uttar pradesh':       'Uttar Pradesh',
    'madhya pradesh':      'Madhya Pradesh',
    'andhra pradesh':      'Andhra Pradesh',
    'arunachal pradesh':   'Arunachal Pradesh',
    'himachal pradesh':    'Himachal Pradesh',
    'tamil nadu':          'Tamil Nadu',
    'tamilnadu':           'Tamil Nadu',
    'west bengal':         'West Bengal',
    'jammu & kashmir':     'Jammu & Kashmir',
    'jammu and kashmir':   'Jammu & Kashmir',
    'jammu':               'Jammu & Kashmir',
    'orissa':              'Odisha',
    'pondicherry':         'Puducherry',
    'uttaranchal':         'Uttarakhand',
    'maharastra':          'Maharashtra',
    'andaman':             'Andaman & Nicobar',
    'andaman and nicobar': 'Andaman & Nicobar',
    'dadra':               'Dadra & Nagar Haveli',
    'daman':               'Daman & Diu',
  }
  const key = state.toLowerCase().trim()
  return map[key] || state.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

// ─────────────────────────────────────────────────────────────
// SOURCE 1 — FAMOUS COLLEGES (always shown first, can't be deduped away)
// ─────────────────────────────────────────────────────────────
const FAMOUS_COLLEGES = [
  // IITs
  { name: "IIT Delhi",                                    city: "New Delhi",          state: "Delhi"              },
  { name: "IIT Bombay",                                   city: "Mumbai",             state: "Maharashtra"        },
  { name: "IIT Madras",                                   city: "Chennai",            state: "Tamil Nadu"         },
  { name: "IIT Kanpur",                                   city: "Kanpur",             state: "Uttar Pradesh"      },
  { name: "IIT Kharagpur",                                city: "Kharagpur",          state: "West Bengal"        },
  { name: "IIT Roorkee",                                  city: "Roorkee",            state: "Uttarakhand"        },
  { name: "IIT Guwahati",                                 city: "Guwahati",           state: "Assam"              },
  { name: "IIT Hyderabad",                                city: "Sangareddy",         state: "Telangana"          },
  { name: "IIT Jodhpur",                                  city: "Jodhpur",            state: "Rajasthan"          },
  { name: "IIT Patna",                                    city: "Patna",              state: "Bihar"              },
  { name: "IIT Ropar",                                    city: "Rupnagar",           state: "Punjab"             },
  { name: "IIT Bhubaneswar",                              city: "Bhubaneswar",        state: "Odisha"             },
  { name: "IIT Gandhinagar",                              city: "Gandhinagar",        state: "Gujarat"            },
  { name: "IIT Indore",                                   city: "Indore",             state: "Madhya Pradesh"     },
  { name: "IIT Mandi",                                    city: "Mandi",              state: "Himachal Pradesh"   },
  { name: "IIT Tirupati",                                 city: "Tirupati",           state: "Andhra Pradesh"     },
  { name: "IIT Palakkad",                                 city: "Palakkad",           state: "Kerala"             },
  { name: "IIT Dharwad",                                  city: "Dharwad",            state: "Karnataka"          },
  { name: "IIT Jammu",                                    city: "Jammu",              state: "Jammu & Kashmir"    },
  { name: "IIT Bhilai",                                   city: "Raipur",             state: "Chhattisgarh"       },
  { name: "IIT Goa",                                      city: "Ponda",              state: "Goa"                },
  { name: "IIT (ISM) Dhanbad",                            city: "Dhanbad",            state: "Jharkhand"          },
  { name: "IIT BHU Varanasi",                             city: "Varanasi",           state: "Uttar Pradesh"      },
  // NITs
  { name: "NIT Trichy",                                   city: "Tiruchirappalli",    state: "Tamil Nadu"         },
  { name: "NIT Warangal",                                 city: "Warangal",           state: "Telangana"          },
  { name: "NIT Surathkal",                                city: "Mangaluru",          state: "Karnataka"          },
  { name: "NIT Calicut",                                  city: "Kozhikode",          state: "Kerala"             },
  { name: "NIT Rourkela",                                 city: "Rourkela",           state: "Odisha"             },
  { name: "MNNIT Allahabad",                              city: "Prayagraj",          state: "Uttar Pradesh"      },
  { name: "MNIT Jaipur",                                  city: "Jaipur",             state: "Rajasthan"          },
  { name: "VNIT Nagpur",                                  city: "Nagpur",             state: "Maharashtra"        },
  { name: "MANIT Bhopal",                                 city: "Bhopal",             state: "Madhya Pradesh"     },
  { name: "NIT Patna",                                    city: "Patna",              state: "Bihar"              },
  { name: "NIT Hamirpur",                                 city: "Hamirpur",           state: "Himachal Pradesh"   },
  { name: "NIT Kurukshetra",                              city: "Kurukshetra",        state: "Haryana"            },
  { name: "NIT Durgapur",                                 city: "Durgapur",           state: "West Bengal"        },
  { name: "NIT Silchar",                                  city: "Silchar",            state: "Assam"              },
  { name: "NIT Agartala",                                 city: "Agartala",           state: "Tripura"            },
  { name: "NIT Jalandhar",                                city: "Jalandhar",          state: "Punjab"             },
  { name: "NIT Srinagar",                                 city: "Srinagar",           state: "Jammu & Kashmir"    },
  { name: "NIT Raipur",                                   city: "Raipur",             state: "Chhattisgarh"       },
  { name: "NIT Jamshedpur",                               city: "Jamshedpur",         state: "Jharkhand"          },
  { name: "NIT Goa",                                      city: "Ponda",              state: "Goa"                },
  { name: "NIT Delhi",                                    city: "New Delhi",          state: "Delhi"              },
  { name: "NIT Uttarakhand",                              city: "Srinagar",           state: "Uttarakhand"        },
  { name: "NIT Andhra Pradesh",                           city: "Tadepalligudem",     state: "Andhra Pradesh"     },
  { name: "NIT Puducherry",                               city: "Karaikal",           state: "Puducherry"         },
  { name: "NIT Manipur",                                  city: "Imphal",             state: "Manipur"            },
  { name: "NIT Meghalaya",                                city: "Shillong",           state: "Meghalaya"          },
  { name: "NIT Mizoram",                                  city: "Aizawl",             state: "Mizoram"            },
  { name: "NIT Arunachal Pradesh",                        city: "Yupia",              state: "Arunachal Pradesh"  },
  { name: "NIT Sikkim",                                   city: "Ravangla",           state: "Sikkim"             },
  // IIITs
  { name: "IIIT Hyderabad",                               city: "Hyderabad",          state: "Telangana"          },
  { name: "IIIT Allahabad",                               city: "Prayagraj",          state: "Uttar Pradesh"      },
  { name: "IIIT Bangalore",                               city: "Bangalore",          state: "Karnataka"          },
  { name: "IIIT Delhi",                                   city: "New Delhi",          state: "Delhi"              },
  { name: "IIIT Pune",                                    city: "Pune",               state: "Maharashtra"        },
  { name: "IIIT Gwalior",                                 city: "Gwalior",            state: "Madhya Pradesh"     },
  { name: "IIIT Jabalpur",                                city: "Jabalpur",           state: "Madhya Pradesh"     },
  { name: "IIIT Kota",                                    city: "Kota",               state: "Rajasthan"          },
  { name: "IIIT Lucknow",                                 city: "Lucknow",            state: "Uttar Pradesh"      },
  { name: "IIIT Nagpur",                                  city: "Nagpur",             state: "Maharashtra"        },
  { name: "IIIT Vadodara",                                city: "Vadodara",           state: "Gujarat"            },
  { name: "IIIT Ranchi",                                  city: "Ranchi",             state: "Jharkhand"          },
  { name: "IIIT Bhopal",                                  city: "Bhopal",             state: "Madhya Pradesh"     },
  { name: "IIIT Surat",                                   city: "Surat",              state: "Gujarat"            },
  { name: "IIIT Una",                                     city: "Una",                state: "Himachal Pradesh"   },
  { name: "IIIT Sonepat",                                 city: "Sonepat",            state: "Haryana"            },
  { name: "IIIT Sri City",                                city: "Chittoor",           state: "Andhra Pradesh"     },
  { name: "IIIT Kalyani",                                 city: "Kalyani",            state: "West Bengal"        },
  { name: "IIIT Kancheepuram",                            city: "Chennai",            state: "Tamil Nadu"         },
  { name: "IIIT Bhubaneswar",                             city: "Bhubaneswar",        state: "Odisha"             },
  // IIMs
  { name: "IIM Ahmedabad",                                city: "Ahmedabad",          state: "Gujarat"            },
  { name: "IIM Bangalore",                                city: "Bangalore",          state: "Karnataka"          },
  { name: "IIM Calcutta",                                 city: "Kolkata",            state: "West Bengal"        },
  { name: "IIM Lucknow",                                  city: "Lucknow",            state: "Uttar Pradesh"      },
  { name: "IIM Kozhikode",                                city: "Kozhikode",          state: "Kerala"             },
  { name: "IIM Indore",                                   city: "Indore",             state: "Madhya Pradesh"     },
  { name: "IIM Shillong",                                 city: "Shillong",           state: "Meghalaya"          },
  { name: "IIM Rohtak",                                   city: "Rohtak",             state: "Haryana"            },
  { name: "IIM Ranchi",                                   city: "Ranchi",             state: "Jharkhand"          },
  { name: "IIM Raipur",                                   city: "Raipur",             state: "Chhattisgarh"       },
  { name: "IIM Tiruchirappalli",                          city: "Tiruchirappalli",    state: "Tamil Nadu"         },
  { name: "IIM Udaipur",                                  city: "Udaipur",            state: "Rajasthan"          },
  { name: "IIM Kashipur",                                 city: "Kashipur",           state: "Uttarakhand"        },
  { name: "IIM Nagpur",                                   city: "Nagpur",             state: "Maharashtra"        },
  { name: "IIM Visakhapatnam",                            city: "Visakhapatnam",      state: "Andhra Pradesh"     },
  { name: "IIM Amritsar",                                 city: "Amritsar",           state: "Punjab"             },
  { name: "IIM Bodh Gaya",                                city: "Bodh Gaya",          state: "Bihar"              },
  { name: "IIM Sambalpur",                                city: "Sambalpur",          state: "Odisha"             },
  { name: "IIM Mumbai",                                   city: "Mumbai",             state: "Maharashtra"        },
  { name: "IIM Jammu",                                    city: "Jammu",              state: "Jammu & Kashmir"    },
  { name: "IIM Sirmaur",                                  city: "Paonta Sahib",       state: "Himachal Pradesh"   },
  // BITS
  { name: "BITS Pilani",                                  city: "Pilani",             state: "Rajasthan"          },
  { name: "BITS Goa",                                     city: "Zuarinagar",         state: "Goa"                },
  { name: "BITS Hyderabad",                               city: "Hyderabad",          state: "Telangana"          },
  // AIIMS
  { name: "AIIMS Delhi",                                  city: "New Delhi",          state: "Delhi"              },
  { name: "AIIMS Bhopal",                                 city: "Bhopal",             state: "Madhya Pradesh"     },
  { name: "AIIMS Bhubaneswar",                            city: "Bhubaneswar",        state: "Odisha"             },
  { name: "AIIMS Jodhpur",                                city: "Jodhpur",            state: "Rajasthan"          },
  { name: "AIIMS Patna",                                  city: "Patna",              state: "Bihar"              },
  { name: "AIIMS Rishikesh",                              city: "Rishikesh",          state: "Uttarakhand"        },
  { name: "AIIMS Raipur",                                 city: "Raipur",             state: "Chhattisgarh"       },
  { name: "AIIMS Nagpur",                                 city: "Nagpur",             state: "Maharashtra"        },
  { name: "AIIMS Gorakhpur",                              city: "Gorakhpur",          state: "Uttar Pradesh"      },
  // Central Universities
  { name: "Delhi University",                             city: "New Delhi",          state: "Delhi"              },
  { name: "JNU",                                          city: "New Delhi",          state: "Delhi"              },
  { name: "BHU Varanasi",                                 city: "Varanasi",           state: "Uttar Pradesh"      },
  { name: "AMU Aligarh",                                  city: "Aligarh",            state: "Uttar Pradesh"      },
  { name: "Hyderabad Central University",                 city: "Hyderabad",          state: "Telangana"          },
  { name: "Jadavpur University",                          city: "Kolkata",            state: "West Bengal"        },
  { name: "Calcutta University",                          city: "Kolkata",            state: "West Bengal"        },
  { name: "University of Mumbai",                         city: "Mumbai",             state: "Maharashtra"        },
  { name: "Madras University",                            city: "Chennai",            state: "Tamil Nadu"         },
  { name: "Pune University SPPU",                         city: "Pune",               state: "Maharashtra"        },
  { name: "Osmania University",                           city: "Hyderabad",          state: "Telangana"          },
  { name: "Anna University",                              city: "Chennai",            state: "Tamil Nadu"         },
  { name: "Panjab University",                            city: "Chandigarh",         state: "Chandigarh"         },
  { name: "Lucknow University",                           city: "Lucknow",            state: "Uttar Pradesh"      },
  { name: "Allahabad University",                         city: "Prayagraj",          state: "Uttar Pradesh"      },
  { name: "Patna University",                             city: "Patna",              state: "Bihar"              },
  { name: "Gauhati University",                           city: "Guwahati",           state: "Assam"              },
  { name: "Mysore University",                            city: "Mysuru",             state: "Karnataka"          },
  { name: "Kerala University",                            city: "Thiruvananthapuram", state: "Kerala"             },
  { name: "Rajasthan University",                         city: "Jaipur",             state: "Rajasthan"          },
  { name: "Gujarat University",                           city: "Ahmedabad",          state: "Gujarat"            },
  { name: "RTM Nagpur University",                        city: "Nagpur",             state: "Maharashtra"        },
  { name: "Pondicherry University",                       city: "Puducherry",         state: "Puducherry"         },
  { name: "IGNOU",                                        city: "New Delhi",          state: "Delhi"              },
  { name: "Tezpur University",                            city: "Tezpur",             state: "Assam"              },
  { name: "NEHU Shillong",                                city: "Shillong",           state: "Meghalaya"          },
  // NLUs
  { name: "NLSIU Bangalore",                              city: "Bangalore",          state: "Karnataka"          },
  { name: "NLU Delhi",                                    city: "New Delhi",          state: "Delhi"              },
  { name: "NLU Jodhpur",                                  city: "Jodhpur",            state: "Rajasthan"          },
  { name: "NALSAR Hyderabad",                             city: "Hyderabad",          state: "Telangana"          },
  { name: "NUJS Kolkata",                                 city: "Kolkata",            state: "West Bengal"        },
  { name: "NLIU Bhopal",                                  city: "Bhopal",             state: "Madhya Pradesh"     },
  { name: "GNLU Gandhinagar",                             city: "Gandhinagar",        state: "Gujarat"            },
  // ── YOUR COLLEGE + SRM campuses ──
  { name: "SRM University NCR Campus Modinagar",          city: "Modinagar",          state: "Uttar Pradesh"      },
  { name: "SRM Institute of Science and Technology Kattankulathur", city: "Chennai",  state: "Tamil Nadu"         },
  { name: "SRM University Delhi-NCR Sonepat",             city: "Sonepat",            state: "Haryana"            },
  { name: "SRM University AP Amaravati",                  city: "Amaravati",          state: "Andhra Pradesh"     },
  { name: "SRM Valliammai Engineering College",           city: "Chennai",            state: "Tamil Nadu"         },
  // Top Private
  { name: "JIIT Noida",                                   city: "Noida",              state: "Uttar Pradesh"      },
  { name: "Jaypee Institute of Information Technology Noida", city: "Noida",          state: "Uttar Pradesh"      },
  { name: "JUIT Waknaghat",                               city: "Solan",              state: "Himachal Pradesh"   },
  { name: "Jaypee University of Information Technology",  city: "Solan",              state: "Himachal Pradesh"   },
  { name: "VIT Vellore",                                  city: "Vellore",            state: "Tamil Nadu"         },
  { name: "VIT Chennai",                                  city: "Chennai",            state: "Tamil Nadu"         },
  { name: "VIT Bhopal",                                   city: "Bhopal",             state: "Madhya Pradesh"     },
  { name: "VIT AP Amaravati",                             city: "Amaravati",          state: "Andhra Pradesh"     },
  { name: "Manipal Institute of Technology",              city: "Manipal",            state: "Karnataka"          },
  { name: "Manipal University Jaipur",                    city: "Jaipur",             state: "Rajasthan"          },
  { name: "Amity University Noida",                       city: "Noida",              state: "Uttar Pradesh"      },
  { name: "Amity University Mumbai",                      city: "Mumbai",             state: "Maharashtra"        },
  { name: "Amity University Jaipur",                      city: "Jaipur",             state: "Rajasthan"          },
  { name: "Amity University Gurgaon",                     city: "Gurugram",           state: "Haryana"            },
  { name: "Amity University Kolkata",                     city: "Kolkata",            state: "West Bengal"        },
  { name: "Lovely Professional University",               city: "Phagwara",           state: "Punjab"             },
  { name: "Chandigarh University",                        city: "Mohali",             state: "Punjab"             },
  { name: "Thapar Institute of Engineering",              city: "Patiala",            state: "Punjab"             },
  { name: "KIIT University Bhubaneswar",                  city: "Bhubaneswar",        state: "Odisha"             },
  { name: "Christ University Bangalore",                  city: "Bangalore",          state: "Karnataka"          },
  { name: "Symbiosis International University",           city: "Pune",               state: "Maharashtra"        },
  { name: "SASTRA University",                            city: "Thanjavur",          state: "Tamil Nadu"         },
  { name: "PSG College of Technology",                    city: "Coimbatore",         state: "Tamil Nadu"         },
  { name: "SSN College of Engineering",                   city: "Chennai",            state: "Tamil Nadu"         },
  { name: "RV College of Engineering",                    city: "Bangalore",          state: "Karnataka"          },
  { name: "BMS College of Engineering",                   city: "Bangalore",          state: "Karnataka"          },
  { name: "PES University",                               city: "Bangalore",          state: "Karnataka"          },
  { name: "MS Ramaiah Institute of Technology",           city: "Bangalore",          state: "Karnataka"          },
  { name: "COEP Pune",                                    city: "Pune",               state: "Maharashtra"        },
  { name: "VJTI Mumbai",                                  city: "Mumbai",             state: "Maharashtra"        },
  { name: "DJ Sanghvi College of Engineering",            city: "Mumbai",             state: "Maharashtra"        },
  { name: "NMIMS University Mumbai",                      city: "Mumbai",             state: "Maharashtra"        },
  { name: "Nirma University",                             city: "Ahmedabad",          state: "Gujarat"            },
  { name: "DAIICT Gandhinagar",                           city: "Gandhinagar",        state: "Gujarat"            },
  { name: "DTU Delhi Technological University",           city: "New Delhi",          state: "Delhi"              },
  { name: "NSUT Delhi",                                   city: "New Delhi",          state: "Delhi"              },
  { name: "Galgotias University",                         city: "Greater Noida",      state: "Uttar Pradesh"      },
  { name: "Sharda University",                            city: "Greater Noida",      state: "Uttar Pradesh"      },
  { name: "Bennett University",                           city: "Greater Noida",      state: "Uttar Pradesh"      },
  { name: "GL Bajaj Institute of Technology",             city: "Greater Noida",      state: "Uttar Pradesh"      },
  { name: "KIET Group of Institutions",                   city: "Ghaziabad",          state: "Uttar Pradesh"      },
  { name: "AKGEC Ghaziabad",                              city: "Ghaziabad",          state: "Uttar Pradesh"      },
  { name: "Ashoka University",                            city: "Sonepat",            state: "Haryana"            },
  { name: "OP Jindal Global University",                  city: "Sonepat",            state: "Haryana"            },
  { name: "MDI Gurgaon",                                  city: "Gurugram",           state: "Haryana"            },
  { name: "Chitkara University Punjab",                   city: "Rajpura",            state: "Punjab"             },
  { name: "Graphic Era University",                       city: "Dehradun",           state: "Uttarakhand"        },
  { name: "UPES Dehradun",                                city: "Dehradun",           state: "Uttarakhand"        },
  { name: "IIEST Shibpur",                                city: "Howrah",             state: "West Bengal"        },
  { name: "Birla Institute of Technology Mesra",          city: "Ranchi",             state: "Jharkhand"          },
  { name: "XLRI Jamshedpur",                              city: "Jamshedpur",         state: "Jharkhand"          },
  { name: "KL University Vijayawada",                     city: "Vijayawada",         state: "Andhra Pradesh"     },
  { name: "JNTUH Hyderabad",                              city: "Hyderabad",          state: "Telangana"          },
  { name: "Amrita Vishwa Vidyapeetham",                   city: "Coimbatore",         state: "Tamil Nadu"         },
  { name: "CMC Vellore",                                  city: "Vellore",            state: "Tamil Nadu"         },
  { name: "Shiv Nadar University",                        city: "Greater Noida",      state: "Uttar Pradesh"      },
  { name: "Plaksha University",                           city: "Mohali",             state: "Punjab"             },
  { name: "FMS Delhi",                                    city: "New Delhi",          state: "Delhi"              },
  { name: "SRCC Delhi",                                   city: "New Delhi",          state: "Delhi"              },
  { name: "St. Stephen's College Delhi",                  city: "New Delhi",          state: "Delhi"              },
  { name: "Miranda House Delhi",                          city: "New Delhi",          state: "Delhi"              },
  { name: "Hindu College Delhi",                          city: "New Delhi",          state: "Delhi"              },
  { name: "Lady Shri Ram College",                        city: "New Delhi",          state: "Delhi"              },
  { name: "Loyola College Chennai",                       city: "Chennai",            state: "Tamil Nadu"         },
  { name: "Madras Christian College",                     city: "Chennai",            state: "Tamil Nadu"         },
  { name: "Presidency University Kolkata",                city: "Kolkata",            state: "West Bengal"        },
]

// ─────────────────────────────────────────────────────────────
// SOURCE 5 — SCHOOLS (hand-curated)
// ─────────────────────────────────────────────────────────────
const SCHOOLS_RAW = [
  { name: "Delhi Public School R.K. Puram",              city: "New Delhi",   state: "Delhi",          board: "CBSE" },
  { name: "Delhi Public School Vasant Kunj",             city: "New Delhi",   state: "Delhi",          board: "CBSE" },
  { name: "Delhi Public School Dwarka",                  city: "New Delhi",   state: "Delhi",          board: "CBSE" },
  { name: "Delhi Public School Mathura Road",            city: "New Delhi",   state: "Delhi",          board: "CBSE" },
  { name: "Modern School Barakhamba Road",               city: "New Delhi",   state: "Delhi",          board: "CBSE" },
  { name: "Modern School Vasant Vihar",                  city: "New Delhi",   state: "Delhi",          board: "CBSE" },
  { name: "Sanskriti School",                            city: "New Delhi",   state: "Delhi",          board: "CBSE" },
  { name: "Springdales School Pusa Road",                city: "New Delhi",   state: "Delhi",          board: "CBSE" },
  { name: "St. Columba's School",                        city: "New Delhi",   state: "Delhi",          board: "CBSE" },
  { name: "Frank Anthony Public School",                 city: "New Delhi",   state: "Delhi",          board: "ICSE" },
  { name: "Bal Bharati Public School Pitampura",         city: "New Delhi",   state: "Delhi",          board: "CBSE" },
  { name: "Kendriya Vidyalaya Andrews Ganj",             city: "New Delhi",   state: "Delhi",          board: "CBSE" },
  { name: "Army Public School Dhaula Kuan",              city: "New Delhi",   state: "Delhi",          board: "CBSE" },
  { name: "Amity International School Saket",            city: "New Delhi",   state: "Delhi",          board: "CBSE" },
  { name: "Sardar Patel Vidyalaya",                      city: "New Delhi",   state: "Delhi",          board: "CBSE" },
  { name: "The Sriram School Moulsari",                  city: "New Delhi",   state: "Delhi",          board: "CBSE" },
  { name: "Delhi Public School Noida",                   city: "Noida",       state: "Uttar Pradesh",  board: "CBSE" },
  { name: "Amity International School Noida",            city: "Noida",       state: "Uttar Pradesh",  board: "CBSE" },
  { name: "Genesis Global School Noida",                 city: "Noida",       state: "Uttar Pradesh",  board: "CBSE" },
  { name: "The Shriram Millennium School Noida",         city: "Noida",       state: "Uttar Pradesh",  board: "CBSE" },
  { name: "Delhi Public School Gurgaon",                 city: "Gurugram",    state: "Haryana",        board: "CBSE" },
  { name: "GD Goenka World School",                      city: "Gurugram",    state: "Haryana",        board: "CBSE" },
  { name: "Dhirubhai Ambani International School",       city: "Mumbai",      state: "Maharashtra",    board: "IB"   },
  { name: "Cathedral and John Connon School",            city: "Mumbai",      state: "Maharashtra",    board: "ICSE" },
  { name: "Bombay Scottish School",                      city: "Mumbai",      state: "Maharashtra",    board: "ICSE" },
  { name: "The Oberoi International School",             city: "Mumbai",      state: "Maharashtra",    board: "IB"   },
  { name: "Campion School Mumbai",                       city: "Mumbai",      state: "Maharashtra",    board: "ICSE" },
  { name: "Jamnabai Narsee School",                      city: "Mumbai",      state: "Maharashtra",    board: "CBSE" },
  { name: "Podar International School Santacruz",        city: "Mumbai",      state: "Maharashtra",    board: "CBSE" },
  { name: "St. Xavier's High School Fort",               city: "Mumbai",      state: "Maharashtra",    board: "ICSE" },
  { name: "Greenlawns High School",                      city: "Mumbai",      state: "Maharashtra",    board: "ICSE" },
  { name: "Ecole Mondiale World School",                 city: "Mumbai",      state: "Maharashtra",    board: "IB"   },
  { name: "The Orchid School Pune",                      city: "Pune",        state: "Maharashtra",    board: "CBSE" },
  { name: "Symbiosis School Pune",                       city: "Pune",        state: "Maharashtra",    board: "CBSE" },
  { name: "Bishops School Pune",                         city: "Pune",        state: "Maharashtra",    board: "ICSE" },
  { name: "Mercedes-Benz International School",          city: "Pune",        state: "Maharashtra",    board: "IB"   },
  { name: "Delhi Public School Bangalore East",          city: "Bangalore",   state: "Karnataka",      board: "CBSE" },
  { name: "Bishop Cotton Boys School",                   city: "Bangalore",   state: "Karnataka",      board: "ICSE" },
  { name: "National Public School Indiranagar",          city: "Bangalore",   state: "Karnataka",      board: "CBSE" },
  { name: "The International School Bangalore",          city: "Bangalore",   state: "Karnataka",      board: "IB"   },
  { name: "Indus International School Bangalore",        city: "Bangalore",   state: "Karnataka",      board: "IB"   },
  { name: "Greenwood High International School",         city: "Bangalore",   state: "Karnataka",      board: "CBSE" },
  { name: "Inventure Academy",                           city: "Bangalore",   state: "Karnataka",      board: "CBSE" },
  { name: "Stonehill International School",              city: "Bangalore",   state: "Karnataka",      board: "IB"   },
  { name: "Padma Seshadri Bala Bhavan",                  city: "Chennai",     state: "Tamil Nadu",     board: "CBSE" },
  { name: "Chettinad Vidyashram",                        city: "Chennai",     state: "Tamil Nadu",     board: "CBSE" },
  { name: "PSBB Millennium School",                      city: "Chennai",     state: "Tamil Nadu",     board: "CBSE" },
  { name: "Hyderabad Public School Begumpet",            city: "Hyderabad",   state: "Telangana",      board: "CBSE" },
  { name: "Hyderabad Public School Ramanthapur",         city: "Hyderabad",   state: "Telangana",      board: "CBSE" },
  { name: "Delhi Public School Nacharam",                city: "Hyderabad",   state: "Telangana",      board: "CBSE" },
  { name: "Oakridge International School Hyderabad",     city: "Hyderabad",   state: "Telangana",      board: "IB"   },
  { name: "Chirec Public School",                        city: "Hyderabad",   state: "Telangana",      board: "CBSE" },
  { name: "La Martiniere for Boys Kolkata",              city: "Kolkata",     state: "West Bengal",    board: "ICSE" },
  { name: "La Martiniere for Girls Kolkata",             city: "Kolkata",     state: "West Bengal",    board: "ICSE" },
  { name: "South Point High School",                     city: "Kolkata",     state: "West Bengal",    board: "CBSE" },
  { name: "St. Xavier's Collegiate School Kolkata",      city: "Kolkata",     state: "West Bengal",    board: "ICSE" },
  { name: "Birla High School Kolkata",                   city: "Kolkata",     state: "West Bengal",    board: "CBSE" },
  { name: "Udgam School for Children Ahmedabad",         city: "Ahmedabad",   state: "Gujarat",        board: "CBSE" },
  { name: "Delhi Public School Bopal",                   city: "Ahmedabad",   state: "Gujarat",        board: "CBSE" },
  { name: "Zydus School for Excellence",                 city: "Ahmedabad",   state: "Gujarat",        board: "CBSE" },
  { name: "Delhi Public School Jaipur",                  city: "Jaipur",      state: "Rajasthan",      board: "CBSE" },
  { name: "Jayshree Periwal International School",       city: "Jaipur",      state: "Rajasthan",      board: "CBSE" },
  { name: "Bhavan Vidyalaya Chandigarh",                 city: "Chandigarh",  state: "Chandigarh",     board: "CBSE" },
  { name: "Delhi Public School Chandigarh",              city: "Chandigarh",  state: "Chandigarh",     board: "CBSE" },
  { name: "City Montessori School Lucknow",              city: "Lucknow",     state: "Uttar Pradesh",  board: "ICSE" },
  { name: "La Martiniere College Lucknow",               city: "Lucknow",     state: "Uttar Pradesh",  board: "ICSE" },
  { name: "The Doon School",                             city: "Dehradun",    state: "Uttarakhand",    board: "CBSE" },
  { name: "Welham Girls School",                         city: "Dehradun",    state: "Uttarakhand",    board: "CBSE" },
  { name: "Welham Boys School",                          city: "Dehradun",    state: "Uttarakhand",    board: "CBSE" },
  { name: "Woodstock School Mussoorie",                  city: "Mussoorie",   state: "Uttarakhand",    board: "CBSE" },
  { name: "Delhi Public School Bhopal",                  city: "Bhopal",      state: "Madhya Pradesh", board: "CBSE" },
  { name: "Choithram School Indore",                     city: "Indore",      state: "Madhya Pradesh", board: "CBSE" },
  { name: "Emerald Heights International School",        city: "Indore",      state: "Madhya Pradesh", board: "CBSE" },
  { name: "Delhi Public School Patna",                   city: "Patna",       state: "Bihar",          board: "CBSE" },
  { name: "Delhi Public School Guwahati",                city: "Guwahati",    state: "Assam",          board: "CBSE" },
  { name: "Choice School Kochi",                         city: "Kochi",       state: "Kerala",         board: "CBSE" },
  { name: "Delhi Public School Kochi",                   city: "Kochi",       state: "Kerala",         board: "CBSE" },
  { name: "Delhi Public School Nagpur",                  city: "Nagpur",      state: "Maharashtra",    board: "CBSE" },
  { name: "Delhi Public School Visakhapatnam",           city: "Visakhapatnam", state: "Andhra Pradesh", board: "CBSE" },
  { name: "Delhi Public School Surat",                   city: "Surat",       state: "Gujarat",        board: "CBSE" },
]

// ─────────────────────────────────────────────────────────────
// MERGE — loads once, caches forever
// ─────────────────────────────────────────────────────────────
let _cache = null

function loadAll() {
  if (_cache) return _cache

  const seen = new Set()
  const all  = []

  function add(inst) {
    const key = dedupKey(inst.name)
    if (!key || seen.has(key)) return
    seen.add(key)
    // normalize state + trim city at load time so all downstream code is clean
    all.push({ ...inst, state: normalizeState(inst.state), city: (inst.city || '').trim() })
  }

  // 1. Famous colleges (priority — shown first in results)
  for (const c of FAMOUS_COLLEGES) add({ ...c, type: 'college' })

  // 2. Schools
  for (const s of SCHOOLS_RAW) add({ ...s, type: 'school' })

  // 3. NIRF CSV — clean City + State columns
  try {
    const rows = parseCSV(readFileSync(join(__dir, '../data/nirf_university_rankings.csv'), 'utf8'))
    for (const r of rows) {
      const name = cleanName(r['Name'] || '')
      if (name) add({ name, city: r['City']?.trim() || '', state: r['State']?.trim() || '', type: 'college' })
    }
  } catch { console.warn('[institutions] nirf CSV not found — skipping') }

  // 4. college-dataNew CSV — location is "City, State"
  try {
    const rows = parseCSV(readFileSync(join(__dir, '../data/college-dataNew.csv'), 'utf8'))
    for (const r of rows) {
      const name = cleanName(r['college_name'] || '')
      const [city = '', state = ''] = (r['location'] || '').split(',').map(s => s.trim())
      if (name) add({ name, city, state, type: 'college' })
    }
  } catch { console.warn('[institutions] college-dataNew CSV not found — skipping') }

  // 5. Engineering colleges CSV — has State, no city
  try {
    const rows = parseCSV(readFileSync(join(__dir, '../data/Indian_Engineering_Colleges_Dataset.csv'), 'utf8'))
    for (const r of rows) {
      const name = cleanName(r['College_Name'] || '')
      if (name) add({ name, city: '', state: r['State']?.trim() || '', type: 'college' })
    }
  } catch { console.warn('[institutions] engineering CSV not found — skipping') }

  const colleges = all.filter(i => i.type === 'college').length
  const schools  = all.filter(i => i.type === 'school').length
  console.log(`[institutions] loaded ${colleges} colleges + ${schools} schools (${all.length} total)`)

  _cache = all
  return _cache
}

// ─────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────

/** Search by name, city, or state. type: 'college' | 'school' | 'all'
 *  state param: optional — filters to a single state (used by LocationPicker
 *  to load cities when user expands a state in the Area tab)
 */
const ALIASES = {
  'dps':  'delhi public school',
  'kv':   'kendriya vidyalaya',
  'aps':  'army public school',
  'nps':  'national public school',
  'jiit': 'jaypee institute',
  'juit': 'jaypee university',
  'lpu':  'lovely professional',
  'cu':   'chandigarh university',
  'du':   'delhi university',
  'jnu':  'jawaharlal nehru',
  'bhu':  'banaras hindu',
  'amu':  'aligarh muslim',
}

export function searchInstitutions(query = '', type = 'all', limit = 20, state = '') {
  const raw = query.toLowerCase().trim()
  const q   = ALIASES[raw] ?? raw

  return loadAll()
    .filter(i => {
      if (type !== 'all' && i.type !== type) return false
      // state filter — used when loading cities for a specific state
      if (state && i.state.toLowerCase() !== state.toLowerCase()) return false
      // empty query returns everything matching type/state filter
      if (!q) return true
      const nameLower  = i.name.toLowerCase()
      const cityLower  = (i.city  || '').toLowerCase()
      const stateLower = (i.state || '').toLowerCase()
      return (
        nameLower.startsWith(q) ||
        cityLower.startsWith(q) ||
        stateLower.startsWith(q)
      )
    })
    .sort((a, b) => {
      const an = a.name.toLowerCase().startsWith(q) ? 0 : 1
      const bn = b.name.toLowerCase().startsWith(q) ? 0 : 1
      return an - bn
    })
    .slice(0, limit)
}

export function getStates(type = 'all') {
  const all = type === 'all' ? loadAll() : loadAll().filter(i => i.type === type)
  const seen = new Map() // lowercase key → normalized value (deduplicates "Delhi ncr" / "Delhi NCR" etc)
  for (const i of all) {
    if (!i.state) continue
    const key = i.state.toLowerCase().trim()
    if (!seen.has(key)) seen.set(key, i.state)
  }
  return [...seen.values()].sort()
}

export function getByState(state, type = 'all') {
  return loadAll().filter(i =>
    (i.state || '').toLowerCase() === state.toLowerCase() &&
    (type === 'all' || i.type === type)
  )
}

export default { searchInstitutions, getStates, getByState }