# Botbuilder
Botbuilder is a VSCode extension to assist in developing FRC java robots.

## Features

### Sidebars
The extension features multiple sidebar treeviews outlining components of the robot.

#### Subsystem View
The subsystem view shows a list of subsytem classes in the workspace. Classes are identified as subsystems if they directly extend `edu.wpi.first.wpilibj2.command.SubsystemBase`. Subsystems can be opened directly from this view.

For each subsytem, the following is shown:
 - Hardware components passed in the constructor, from the hardware list in `botbuilder.json` (name & type)
 - Publicly accessible fields & all constants (name, scope, modifiers, type, value if final)
 - Publicly accessible functions (name, parameters, return type)
 - Publicly accessible enums and inner classes (name, fields/values, functions)

#### Command View
The command view shows a list of command classes in the workspace. Classes are identified as command if they directly extend `edu.wpi.first.wpilibj2.command.CommandBase` or `edu.wpi.first.wpilibj2.command.InstantCommand`. Commands can be opened directly from this view.

For each command, the following is shown:
 - Whether the command is normal, instant, or autonomous (auto determined by package)
 - Subsystems passed in the constructor (name & class)
 - Publicly accessible fields & all constants (name, scope, modifiers, type, value if final)
 - Publicly accessible functions (name, parameters, return type)
 - Publicly accessible enums and inner classes (name, fields/values, functions)

### Wizards
The extension also adds wizards for creating subsystems and commands

#### Subsystem Wizard
The subsystem wizard allows for the simplified creation of subsystems. It has the following options:
 - **Name:** Name of the subystem
 - **Description:** A description of the subsystem that will be used as javadoc
 - **Package:** The package where the subsytem will be placed
 - **Hardware**: A list of hardware components required by the subsystem. These are passed to the constructor then stored in fields.
   - **Type:** A dropdown list of hardware types defined in `botbuilder.json`
   - **Name:** The name of the hardware component variable
   - **Javadoc:** The javadoc describing the hardware component

#### Command Wizard
The command wizard allows for the simplified creation of commands. It has the following options:
 - **Name:** Name of the command, a warning will be given if this does not meet the format `*Command`
 - **Description:** A description of the command that will be used as javadoc
 - **Package:** The package where the command will be placed
 - **Auto:** If checked, the command will be placed in the autonomous package
 - **Instant:** If checked, the command will extend `InstantCommand` and be placed in the instant package
 - **Subsystems**: A list of subsystems required by the command. These are passed to the constructor then stored in fields.
   - **Type:** A dropdown list of subsytems found in the workspace
   - **Name:** The name of the subsytem variable
   - **Required:** If checked, the `addRequirements` function will be called for this subsystem. 
   - **Javadoc:** The javadoc describing the subsystem

## Requirements
The Botbuilder extension requires that the project be valid FRC Robot code.

## Configuration 
The extension uses it's own JSON configuration file. This file is created automatically when botbuilder is initialized.

The location of this file is set by the VSCode setting `botbuilder.configPath`. The default is a file named `botbuilder.json` at the workspace root.

#### Package configuration
There are five configuration entries which are used to configure the packages for code elements. These are:
 - **subsystemPackage:** The package where subsystems will be placed
 - **commandPackage:** The package where commands will be placed
 - **instantCommandPackage:** The package where instant commands will be placed
 - **autoCommandPackage:** The package where auto commands will be placed. Additionally, commands in this package will be marked as autonomous in the command view
 - **instantAutoCommandPackage:** The package where commands that are both instant and autonomous will be placed. Additionally, commands in this package will be marked as autonomous in the command view


#### Build configuration
There are four configuration entries which are used to locate source and built files
 - **baseClassName:** The name of the entry class, this will be used to determine the base package
 - **srcFolder:** The java source folder
 - **buildFolder:** The gradle build folder
 - **testFolder:** The java test folder

#### Hardware configuration
The hardware configuration is the list of hardware components that will be recognised by the extension. Components are broken into four categories: motorControllers, pneumatics, sensors, and other.

Each component has the following properties
 - **name:** The name of component's class
 - **prettyName:** A pretty-print name to be used on the frontend
 - **descriptor:** The [java descriptor](https://docs.oracle.com/javase/specs/jvms/se7/html/jvms-4.html#jvms-4.2.1) for the component's class


