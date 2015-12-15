diagram = {
  "creator": "Yosys 0.5+220 (git sha1 94fbaff, emcc  -Os)",
  "modules": {
    "up3down5": {
      "ports": {
        "clock": {
          "direction": "input",
          "bits": [ 2 ]
        },
        "data_in": {
          "direction": "input",
          "bits": [ 3, 4, 5, 6, 7, 8, 9, 10, 11 ]
        },
        "up": {
          "direction": "input",
          "bits": [ 12 ]
        },
        "down": {
          "direction": "input",
          "bits": [ 13 ]
        },
        "carry_out": {
          "direction": "output",
          "bits": [ 14 ]
        },
        "borrow_out": {
          "direction": "output",
          "bits": [ 15 ]
        },
        "count_out": {
          "direction": "output",
          "bits": [ 16, 17, 18, 19, 20, 21, 22, 23, 24 ]
        },
        "parity_out": {
          "direction": "output",
          "bits": [ 25 ]
        }
      },
      "cells": {
        "$add$input.v:17$3": {
          "hide_name": 1,
          "type": "$add",
          "parameters": {
            "A_SIGNED": 0,
            "A_WIDTH": 9,
            "B_SIGNED": 0,
            "B_WIDTH": 2,
            "Y_WIDTH": 10
          },
          "attributes": {
            "src": "input.v:17"
          },
          "port_directions": {
            "A": "input",
            "B": "input",
            "Y": "output"
          },
          "connections": {
            "A": [ 16, 17, 18, 19, 20, 21, 22, 23, 24 ],
            "B": [ "1", "1" ],
            "Y": [ 26, 27, 28, 29, 30, 31, 32, 33, 34, 35 ]
          }
        },
        "$and$input.v:28$5": {
          "hide_name": 1,
          "type": "$and",
          "parameters": {
            "A_SIGNED": 0,
            "A_WIDTH": 1,
            "B_SIGNED": 0,
            "B_WIDTH": 1,
            "Y_WIDTH": 1
          },
          "attributes": {
            "src": "input.v:28"
          },
          "port_directions": {
            "A": "input",
            "B": "input",
            "Y": "output"
          },
          "connections": {
            "A": [ 12 ],
            "B": [ 35 ],
            "Y": [ 36 ]
          }
        },
        "$and$input.v:29$6": {
          "hide_name": 1,
          "type": "$and",
          "parameters": {
            "A_SIGNED": 0,
            "A_WIDTH": 1,
            "B_SIGNED": 0,
            "B_WIDTH": 1,
            "Y_WIDTH": 1
          },
          "attributes": {
            "src": "input.v:29"
          },
          "port_directions": {
            "A": "input",
            "B": "input",
            "Y": "output"
          },
          "connections": {
            "A": [ 13 ],
            "B": [ 37 ],
            "Y": [ 38 ]
          }
        },
        "$procdff$40": {
          "hide_name": 1,
          "type": "$dff",
          "parameters": {
            "CLK_POLARITY": 1,
            "WIDTH": 9
          },
          "attributes": {
            "src": "input.v:14"
          },
          "port_directions": {
            "CLK": "input",
            "D": "input",
            "Q": "output"
          },
          "connections": {
            "CLK": [ 2 ],
            "D": [ 39, 40, 41, 42, 43, 44, 45, 46, 47 ],
            "Q": [ 16, 17, 18, 19, 20, 21, 22, 23, 24 ]
          }
        },
        "$procdff$41": {
          "hide_name": 1,
          "type": "$dff",
          "parameters": {
            "CLK_POLARITY": 1,
            "WIDTH": 1
          },
          "attributes": {
            "src": "input.v:14"
          },
          "port_directions": {
            "CLK": "input",
            "D": "input",
            "Q": "output"
          },
          "connections": {
            "CLK": [ 2 ],
            "D": [ 36 ],
            "Q": [ 14 ]
          }
        },
        "$procdff$42": {
          "hide_name": 1,
          "type": "$dff",
          "parameters": {
            "CLK_POLARITY": 1,
            "WIDTH": 1
          },
          "attributes": {
            "src": "input.v:14"
          },
          "port_directions": {
            "CLK": "input",
            "D": "input",
            "Q": "output"
          },
          "connections": {
            "CLK": [ 2 ],
            "D": [ 38 ],
            "Q": [ 15 ]
          }
        },
        "$procdff$43": {
          "hide_name": 1,
          "type": "$dff",
          "parameters": {
            "CLK_POLARITY": 1,
            "WIDTH": 1
          },
          "attributes": {
            "src": "input.v:14"
          },
          "port_directions": {
            "CLK": "input",
            "D": "input",
            "Q": "output"
          },
          "connections": {
            "CLK": [ 2 ],
            "D": [ 48 ],
            "Q": [ 25 ]
          }
        },
        "$procmux$36": {
          "hide_name": 1,
          "type": "$pmux",
          "parameters": {
            "S_WIDTH": 3,
            "WIDTH": 9
          },
          "attributes": {
          },
          "port_directions": {
            "A": "input",
            "B": "input",
            "S": "input",
            "Y": "output"
          },
          "connections": {
            "A": [ 16, 17, 18, 19, 20, 21, 22, 23, 24 ],
            "B": [ 26, 27, 28, 29, 30, 31, 32, 33, 34, 49, 50, 51, 52, 53, 54, 55, 56, 57, 3, 4, 5, 6, 7, 8, 9, 10, 11 ],
            "S": [ 58, 59, 60 ],
            "Y": [ 39, 40, 41, 42, 43, 44, 45, 46, 47 ]
          }
        },
        "$procmux$37_CMP0": {
          "hide_name": 1,
          "type": "$eq",
          "parameters": {
            "A_SIGNED": 0,
            "A_WIDTH": 2,
            "B_SIGNED": 0,
            "B_WIDTH": 2,
            "Y_WIDTH": 1
          },
          "attributes": {
          },
          "port_directions": {
            "A": "input",
            "B": "input",
            "Y": "output"
          },
          "connections": {
            "A": [ 13, 12 ],
            "B": [ "0", "1" ],
            "Y": [ 58 ]
          }
        },
        "$procmux$38_CMP0": {
          "hide_name": 1,
          "type": "$eq",
          "parameters": {
            "A_SIGNED": 0,
            "A_WIDTH": 2,
            "B_SIGNED": 0,
            "B_WIDTH": 2,
            "Y_WIDTH": 1
          },
          "attributes": {
          },
          "port_directions": {
            "A": "input",
            "B": "input",
            "Y": "output"
          },
          "connections": {
            "A": [ 13, 12 ],
            "B": [ "1", "0" ],
            "Y": [ 59 ]
          }
        },
        "$procmux$39_CMP0": {
          "hide_name": 1,
          "type": "$eq",
          "parameters": {
            "A_SIGNED": 0,
            "A_WIDTH": 2,
            "B_SIGNED": 0,
            "B_WIDTH": 2,
            "Y_WIDTH": 1
          },
          "attributes": {
          },
          "port_directions": {
            "A": "input",
            "B": "input",
            "Y": "output"
          },
          "connections": {
            "A": [ 13, 12 ],
            "B": [ "0", "0" ],
            "Y": [ 60 ]
          }
        },
        "$reduce_xor$input.v:27$4": {
          "hide_name": 1,
          "type": "$reduce_xor",
          "parameters": {
            "A_SIGNED": 0,
            "A_WIDTH": 9,
            "Y_WIDTH": 1
          },
          "attributes": {
            "src": "input.v:27"
          },
          "port_directions": {
            "A": "input",
            "Y": "output"
          },
          "connections": {
            "A": [ 39, 40, 41, 42, 43, 44, 45, 46, 47 ],
            "Y": [ 48 ]
          }
        },
        "$sub$input.v:16$2": {
          "hide_name": 1,
          "type": "$sub",
          "parameters": {
            "A_SIGNED": 0,
            "A_WIDTH": 9,
            "B_SIGNED": 0,
            "B_WIDTH": 3,
            "Y_WIDTH": 10
          },
          "attributes": {
            "src": "input.v:16"
          },
          "port_directions": {
            "A": "input",
            "B": "input",
            "Y": "output"
          },
          "connections": {
            "A": [ 16, 17, 18, 19, 20, 21, 22, 23, 24 ],
            "B": [ "1", "0", "1" ],
            "Y": [ 49, 50, 51, 52, 53, 54, 55, 56, 57, 37 ]
          }
        }
      },
      "netnames": {
        "$0\\borrow_out[0:0]": {
          "hide_name": 1,
          "bits": [ 38 ],
          "attributes": {
            "src": "input.v:14"
          }
        },
        "$0\\carry_out[0:0]": {
          "hide_name": 1,
          "bits": [ 36 ],
          "attributes": {
            "src": "input.v:14"
          }
        },
        "$0\\cnt_dn[9:0]": {
          "hide_name": 1,
          "bits": [ 49, 50, 51, 52, 53, 54, 55, 56, 57, 37 ],
          "attributes": {
            "src": "input.v:14"
          }
        },
        "$0\\cnt_up[9:0]": {
          "hide_name": 1,
          "bits": [ 26, 27, 28, 29, 30, 31, 32, 33, 34, 35 ],
          "attributes": {
            "src": "input.v:14"
          }
        },
        "$0\\count_out[8:0]": {
          "hide_name": 1,
          "bits": [ 39, 40, 41, 42, 43, 44, 45, 46, 47 ],
          "attributes": {
            "src": "input.v:14"
          }
        },
        "$0\\parity_out[0:0]": {
          "hide_name": 1,
          "bits": [ 48 ],
          "attributes": {
            "src": "input.v:14"
          }
        },
        "$procmux$37_CMP": {
          "hide_name": 1,
          "bits": [ 58 ],
          "attributes": {
          }
        },
        "$procmux$38_CMP": {
          "hide_name": 1,
          "bits": [ 59 ],
          "attributes": {
          }
        },
        "$procmux$39_CMP": {
          "hide_name": 1,
          "bits": [ 60 ],
          "attributes": {
          }
        },
        "borrow_out": {
          "hide_name": 0,
          "bits": [ 15 ],
          "attributes": {
            "src": "input.v:9"
          }
        },
        "carry_out": {
          "hide_name": 0,
          "bits": [ 14 ],
          "attributes": {
            "src": "input.v:9"
          }
        },
        "clock": {
          "hide_name": 0,
          "bits": [ 2 ],
          "attributes": {
            "src": "input.v:6"
          }
        },
        "count_out": {
          "hide_name": 0,
          "bits": [ 16, 17, 18, 19, 20, 21, 22, 23, 24 ],
          "attributes": {
            "src": "input.v:8"
          }
        },
        "data_in": {
          "hide_name": 0,
          "bits": [ 3, 4, 5, 6, 7, 8, 9, 10, 11 ],
          "attributes": {
            "src": "input.v:5"
          }
        },
        "down": {
          "hide_name": 0,
          "bits": [ 13 ],
          "attributes": {
            "src": "input.v:6"
          }
        },
        "parity_out": {
          "hide_name": 0,
          "bits": [ 25 ],
          "attributes": {
            "src": "input.v:9"
          }
        },
        "up": {
          "hide_name": 0,
          "bits": [ 12 ],
          "attributes": {
            "src": "input.v:6"
          }
        }
      }
    }
  }
}