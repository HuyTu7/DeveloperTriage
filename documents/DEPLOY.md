# Create Virtual Machine on EC2

Create an Amazon EC2 instance using Ubuntu 14.04 AMI

# Creating Virtual Machine on Host Machine(Optional for *nix users)

Install [vagrant](https://www.vagrantup.com/downloads.html).

You will also need a [virtual machine provider](https://docs.vagrantup.com/v2/providers/). [VirtualBox](https://www.virtualbox.org/wiki/Downloads) is a recommended provider.

Initialize a virtual machine. `ubuntu/trusty64` is one default image. A list of other virtual machine images can be found [here](https://atlas.hashicorp.com/boxes/search).

    vagrant init ubuntu/trusty64

Start up the virtual machine.

    vagrant up

Then    

    vagrant ssh

You should be able to connect to the machine.

# Ansible Server setup

### Let's setup some stuff first

We want to create a master server that runs Ansible. First, use a binary package manager to setup some basic stuff missing.

    sudo apt-get update
    sudo apt-get -y install git make vim python-dev python-pip libffi-dev libssl-dev libxml2-dev libxslt1-dev libjpeg8-dev zlib1g-dev

Now get ansible itself.

    sudo pip install ansible

#### Test ansible

    ansible all -m ping

**Note, you should not expect to see anything working, quite yet, this just makes sure, python, etc. is setup properly.**

#### Setting up ssh keys

Create a `keys/node0.key` file that contains the private_key of the EC2 instance.  You may need to `chmod 500 keys/node0.key`.

#### Creating an inventory file

Create a `inventory` file that contains something like the following.  **Note use EC2's instance's public ip and private_key**:
    
    node0 ansible_ssh_host=35.163.251.8 ansible_ssh_user=ubuntu ansible_ssh_private_key_file=./keys/node0.key

#### Testing connection

Now, run the ping test again to make sure you can actually talk to the EC2 instance!

    ansible all -m ping -i inventory -vvvv
    
# Update your environment variables
   ```
   # Edit .bash_profile to have:
   export GTOKEN="<github-token>"
   export BOT_TOKEN="<slacktoken>"
   # Then reload
   $ source ~/.bash_profile
   ```
#### Run your playbook file:

    ansible-playbook -i inventory -vvv playbook.yml
    
The Bot should be up and running once the ansible script is completed successfully.
